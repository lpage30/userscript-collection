import React, { useState, useRef, useEffect, JSX } from 'react'
import { Button } from 'primereact/button'
import { ServiceStatus, CompanyHealthStatus, isServiceStatusForAnyCompanies } from '../statustypes'
import { ServiceHealthStatusSpan } from './IndicatorStatusComponents'
import { Card } from '../../dashboardcomponents/datatypes'
import { Dashboard } from '../../dashboardcomponents/Dashboard'
import { StatusAPIs } from '../statusAPIs'
import { toServiceStatusCard } from '../statustypes'
import { ServiceStatusComponent } from './ServiceStatusComponent'
import {
  CompanyHealthLevelTypeInfoMap,
} from './IndicatorStatusTypeInfoMaps'
import { getSortedStatusLevels, getStatusMetadata, sortServiceByStatusIndicatorRank } from '../statusService'
import { createSpinningContentElement } from '../../common/ui/style_functions'
import { reactToHTMLElement } from '../../common/ui/renderRenderable'

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
      if (onServiceStatus) {
        onServiceStatus(statuses)
      }
      setState({
        ...state,
        initialStatuses: statuses
      })
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

    let buttonContent = (action: string): string | JSX.Element => `${action} Service Dashboard`
    if (state.isLoading) {

      buttonContent = (action: string): string | JSX.Element => createSpinningContentElement({
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
        >{buttonContent('View')}</Button>
        {state.visible && (
          <Dashboard
            title={'Service Status Dashboard'}
            getCards={() => state.initialStatuses.map(toServiceStatusCard)}
            contentLayout={{
              type: 'Card',
              properties: {
                layout: 'vertical',
                cardStyle: {
                  borderTop: '1px solid #ddd',
                  borderLeft: '1px solid #ddd',
                  borderRight: '2px solid #bbb',
                  borderBottom: '2px solid #bbb;',
                  backgroundColor: '#fcfcfc',
                },
                toCardComponent: (card: Card): HTMLElement =>
                  reactToHTMLElement(card.elementId,
                    <ServiceStatusComponent
                      serviceStatus={card as ServiceStatus}
                      companyHealthStatuses={companyHealthStatuses}
                    />)
              }
            }}
            cardLoadingAPI={StatusAPIs}
            closeable={true}
            onVisibleChange={(visible: boolean) => {
              setState({
                ...state,
                visible
              })
            }}
            registerLoadFunction={reload => {
              refreshDashboardRef.current = reload
            }}
            onCardsLoaded={cards => { if (onServiceStatus) onServiceStatus(cards.map(c => c as ServiceStatus)) }}
            addedHeaderComponents={[
              {
                after: 'lastrow',
                element: (
                  <Button
                    className="app-button"
                    onClick={() => { if (refreshDashboardRef.current) refreshDashboardRef.current(true, true) }}
                    disabled={state.isLoading}>{buttonContent('Refresh')}</Button>
                )
              },
              {
                after: 'lastColumn',
                element: (
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
                )
              }
            ]}
          />)
        }
      </div>
    )
  }
  return render()
}

interface ServiceDashboardPopupAndSummaryProps extends ServiceDashboardPopupProps {
  isolatedCompanyNames?: string[]
}

export const ServiceDashboardPopupAndSummary: React.FC<ServiceDashboardPopupAndSummaryProps> = ({
  onServiceStatus,
  companyHealthStatuses,
  statusesPerRow = 10,
  isolatedCompanyNames,
}) => {
  const [statuses, setStatuses] = useState<ServiceStatus[][]>([])

  const setServiceStatus = (serviceStatus: ServiceStatus[]) => {
    const displayStatus = [...serviceStatus]
      .filter(status => {
        return undefined === isolatedCompanyNames ||
          0 === isolatedCompanyNames.length ||
          isServiceStatusForAnyCompanies(status, isolatedCompanyNames)
      })
      .sort(sortServiceByStatusIndicatorRank)
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
                <td style={{ textAlign: 'right' }}><span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Legend:</span></td>
                <td><div style={{ display: 'flex', alignItems: 'center' }}>
                  {
                    getSortedStatusLevels()
                      .map(level => (
                        <span className="text-sm" style={{
                          backgroundColor: getStatusMetadata(level).bgColor,
                          color: getStatusMetadata(level).fgColor,
                          paddingLeft: `5px`,
                          paddingRight: `5px`
                        }}>{getStatusMetadata(level).statusName}</span>
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