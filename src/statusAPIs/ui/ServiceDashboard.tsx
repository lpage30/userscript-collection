import React, { useState, useRef, useEffect, JSX, CSSProperties } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { ServiceStatus, CompanyHealthStatus } from '../statustypes'
import { ServiceHealthStatusSpan } from './IndicatorStatusComponents'
import { StatusAPIs } from '../statusAPIs'
import ServiceStatusComponent from './ServiceStatusComponent'
import {
  CompanyHealthLevelTypeInfoMap,
  IndicatorTypeInfoMap,
  sortIndicatorByIndicatorRank,
  sortServiceByIndicatorRank
} from './IndicatorStatusTypeInfoMaps'
import { createSpinningContentElement } from '../../common/ui/style_functions'

interface ServiceDashboardProps {
  title: string
  initialStatuses: ServiceStatus[]
  companyHealthStatuses?: CompanyHealthStatus[]
  onServiceStatus?: (serviceStatus: ServiceStatus[]) => void
  registerRefreshFunction?: (refreshFunction: (showDialog: boolean, force: boolean) => Promise<void>) => void
  onVisibleChange?: (visible: boolean) => void
  initiallyVisible?: boolean
}
interface ServiceDashboardState {
  visible: boolean
  isLoading: boolean
  statuses: ServiceStatus[]
  companyStatuses: CompanyHealthStatus[]
}

const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  title,
  onServiceStatus,
  registerRefreshFunction,
  onVisibleChange,
  initialStatuses,
  companyHealthStatuses,
}) => {
  const [state, setState] = useState<ServiceDashboardState>({
    visible: true,
    isLoading: StatusAPIs.isLoading,
    statuses: initialStatuses.sort(sortServiceByIndicatorRank),
    companyStatuses: companyHealthStatuses ?? [],
  })
  StatusAPIs.registerOnIsLoadingChange((isLoading: boolean) => {
    setState({
      ...state,
      isLoading
    })
  })
  const refresh = async (showDialog: boolean, force: boolean): Promise<void> => {
    const statuses = (await StatusAPIs.load(force)).sort(sortServiceByIndicatorRank)
    if (onServiceStatus) {
      onServiceStatus(statuses)
    }
    if (onVisibleChange) onVisibleChange(showDialog)
    setState({
      ...state,
      visible: showDialog,
      statuses,
    })
  }
  if (registerRefreshFunction) registerRefreshFunction(refresh)

  const hideDialog = () => {
    setState({
      ...state,
      visible: false
    })
    if (onVisibleChange) onVisibleChange(false)
  }
  const render = () => {
    let buttonContent: string | JSX.Element = 'Refresh Service Statuses'
    if (state.isLoading) {

      buttonContent = createSpinningContentElement({
        popupElementType: 'NoPopup',
        spinnerSize: 'small',
        content: {
          content: 'Refreshing Service Statuses'
        }
      })
    }

    return (
      <Dialog
        showHeader={true}
        closable={true}
        position={'center'}
        visible={state.visible}
        onHide={() => hideDialog()}
        style={{ width: '90vw', height: '90vh' }}
        header={
          <table
            style={{
              tableLayout: 'auto',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginTop: '0',
              marginBottom: 'auto',
              width: '100%',
            }}
          ><tbody>
              <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                <td colSpan={2} className="text-center">
                  <h2>{title}</h2>
                </td>
              </tr>
              <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                <td>
                  <Button
                    onClick={() => refresh(true, true)}
                    disabled={state.isLoading}>{buttonContent}</Button>
                </td>
                <td>
                  <div style={{ display: 'flex' }}>
                    <span className="text-sm">Company Color Legend:&nbsp;</span>{
                      Object.keys(CompanyHealthLevelTypeInfoMap)
                        .sort((l: string, r: string) => CompanyHealthLevelTypeInfoMap[l].rank = CompanyHealthLevelTypeInfoMap[r].rank)
                        .map(level => (
                          <span className="text-sm" style={{
                            backgroundColor: CompanyHealthLevelTypeInfoMap[level].bgColor,
                            color: CompanyHealthLevelTypeInfoMap[level].fgColor,
                            paddingLeft: `5px`,
                            paddingRight: `5px`
                          }}>{CompanyHealthLevelTypeInfoMap[level].displayName}</span>
                        ))
                    }
                  </div>
                </td>
              </tr>
            </tbody></table>
        }
        className='p-dialog-maximized'
      >
        {state.statuses.map((serviceStatus, index) => (<>
          {0 < index && <hr />}
          <ServiceStatusComponent
            serviceStatus={serviceStatus}
            companyHealthStatuses={companyHealthStatuses}
          />
        </>))}
      </Dialog>
    )
  }
  return render()
}
interface ServiceDashboardPopupProps {
  onServiceStatus?: (serviceStatus: ServiceStatus[]) => void
  companyHealthStatuses?: CompanyHealthStatus[]
  statusesPerRow?: number
}

interface ServiceDashboardPopupState {
  visible: boolean
  initialStatuses: ServiceStatus[]
  isLoading: boolean
  dashboardVisible: boolean
}
export const ServiceDashboardPopup: React.FC<ServiceDashboardPopupProps> = ({
  onServiceStatus,
  companyHealthStatuses
}) => {
  const [state, setState] = useState<ServiceDashboardPopupState>({
    visible: false,
    initialStatuses: [],
    isLoading: StatusAPIs.isLoading,
    dashboardVisible: false
  })
  const refreshDashboardRef = useRef<(showDialog: boolean, force: boolean) => Promise<void>>(null)
  StatusAPIs.registerOnIsLoadingChange((isLoading: boolean) => {
    setState({
      ...state,
      isLoading
    })
  })
  useEffect(() => {
    StatusAPIs.load(false).then(statuses => {
      setState({
        ...state,
        initialStatuses: statuses
      })
      if (onServiceStatus) {
        onServiceStatus(statuses)
      }
    })
  }, [])
  const onViewDashboard = async () => {
    setState({
      ...state,
      visible: true
    })
    if (refreshDashboardRef.current) await refreshDashboardRef.current(true, false)
  }
  const render = () => {
    let buttonContent: string | JSX.Element = 'View Service Dashboard'
    if (state.isLoading) {

      buttonContent = createSpinningContentElement({
        popupElementType: 'NoPopup',
        spinnerSize: 'small',
        content: {
          content: 'Loading Service Dashboard'
        }
      })
    }
    return (
      <div>
        <Button
          className="app-button"
          onClick={() => onViewDashboard()}
          disabled={state.isLoading}
        >{buttonContent}</Button>
        {state.visible && <ServiceDashboard
          title={'Service Status Dashboard'}
          companyHealthStatuses={companyHealthStatuses}
          initialStatuses={state.initialStatuses}
          onServiceStatus={onServiceStatus}
          onVisibleChange={(visible: boolean) => {
            setState({
              ...state,
              visible
            })
          }}
          registerRefreshFunction={(refreshDashboard: (showDialog: boolean, force: boolean) => Promise<void>) => {
            refreshDashboardRef.current = refreshDashboard
          }}
        />}
      </div>
    )
  }
  return render()
}

export const ServiceDashboardPopupAndSummary: React.FC<ServiceDashboardPopupProps> = ({
  onServiceStatus,
  companyHealthStatuses,
  statusesPerRow = 15
}) => {
  const [statuses, setStatuses] = useState<ServiceStatus[][]>([])

  const setServiceStatus = (serviceStatus: ServiceStatus[]) => {
    const displayStatus = [...serviceStatus]
      .sort(sortServiceByIndicatorRank)
      .reduce((rows, status, index) => {
        if (0 === (index % statusesPerRow)) {
          rows.push([])
        }
        rows[rows.length - 1].push(status)
        return rows
      }, [] as ServiceStatus[][])

    setStatuses(displayStatus)
    if (onServiceStatus) onServiceStatus(serviceStatus)
  }
  const render = () => {
    const statusRows = statuses.map(statusRow => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {statusRow.map((status, index) => (
          <>
            {0 < index && <span className="text-sm">&nbsp;&#x2022;&nbsp;</span>}
            {ServiceHealthStatusSpan(
              status,
              0 < index ? 5 : 3,
              (index + 1) < statuses.length ? 5 : 3
            )}
          </>
        ))}
      </div>
    ))
    return (
      <div style={{ display: 'flex' }}>
        <ServiceDashboardPopup
          onServiceStatus={setServiceStatus}
          companyHealthStatuses={companyHealthStatuses}
        />
        {0 < statuses.length && (
          <table
            style={{
              tableLayout: 'auto',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginTop: '0',
              marginBottom: 'auto',
              width: '100%',
            }}
          ><tbody>
              <tr style={{ alignItems: 'center', verticalAlign: 'bottom' }}>
                <td style={{ textAlign: 'right' }}><span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Service Color Legend:</span></td>
                <td><div style={{ display: 'flex', alignItems: 'center' }}>
                  {
                    Object.keys(IndicatorTypeInfoMap).sort(sortIndicatorByIndicatorRank)
                      .map(level => (
                        <span className="text-sm" style={{
                          backgroundColor: IndicatorTypeInfoMap[level].bgColor,
                          color: IndicatorTypeInfoMap[level].fgColor,
                          paddingLeft: `5px`,
                          paddingRight: `5px`
                        }}>{IndicatorTypeInfoMap[level].displayName}</span>
                      ))
                  }
                </div></td>
              </tr>
              <tr style={{ alignItems: 'center', verticalAlign: 'bottom' }}>
                <td style={{ textAlign: 'right' }}><span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Services:</span></td>
                <td>{statusRows[0]}</td>
              </tr>
              {statusRows.slice(1).map(row => (
                <tr style={{ alignItems: 'center', verticalAlign: 'bottom' }}>
                  <td></td><td>{row}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }
  return render()
}
export default ServiceDashboard