import React, { useState, useEffect, useRef} from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { ServiceStatus, CompanyHealthStatus } from '../statustypes'
import { StatusAPIs } from '../statusAPIs'
import ServiceStatusComponent, {statusRankColorMap} from './ServiceStatusComponent'

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
  companyHealthStatuses
}) => {
  const [state, setState] = useState<ServiceDashboardState>({
    visible: true,
    isLoading: StatusAPIs.isLoading,
    statuses: initialStatuses,
    companyStatuses: companyHealthStatuses ?? [],
  })
  StatusAPIs.registerOnIsLoadingChange((isLoading: boolean) => {
    setState({
      ...state,
      isLoading
    })
  })
  const refresh = async (showDialog: boolean, force: boolean): Promise<void> => {
    const statuses = await StatusAPIs.load(force)
    if (onServiceStatus) {
      onServiceStatus(statuses)
    }
    if (registerRefreshFunction) registerRefreshFunction(refresh)
    if (onVisibleChange) onVisibleChange(showDialog)
    setState({
      ...state,
      visible: showDialog,
      statuses
    })
  }

  const hideDialog = () => {
    setState({
      ...state,
      visible: false
    })
    if (onVisibleChange) onVisibleChange(false)
  }
  return (
    <Dialog
      showHeader={true}
      closable={true}
      position={'center'}
      visible={state.visible}
      onHide={() => hideDialog()}
      style={{ width: '90vw', height: '90vh'}}
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
              <td colSpan={2}className="text-center">
                <h2>{title}</h2>
              </td>
            </tr>
            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
              <td>
                  <Button
                    onClick={() => refresh(true, true)}
                    disabled={state.isLoading}>{state.isLoading ? 'Loading' : 'Refresh'} Service Statuses</Button>
              </td>
              <td>
                <div style={{display: 'flex'}}>
                  <span className="text-sm">Company Color Legend:&nbsp;</span>{
                    Object.keys(statusRankColorMap)
                      .sort((l: string, r: string) => statusRankColorMap[l].rank = statusRankColorMap[r].rank)
                      .map(level => (
                        <span className="text-sm" style={{
                          backgroundColor: statusRankColorMap[level].bgColor,
                          color: statusRankColorMap[level].fgColor,
                          paddingLeft: `5px`,
                          paddingRight: `5px`
                        }}>{statusRankColorMap[level].displayName}</span>
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
        {0 < index && <hr/>}
        <ServiceStatusComponent
          serviceStatus={serviceStatus}
          companyHealthStatuses={companyHealthStatuses}
        />
      </>))}
    </Dialog>
  )
}
interface ServiceDashboardPopupProps {
  onServiceStatus?: (serviceStatus: ServiceStatus[]) => void
  companyHealthStatuses?: CompanyHealthStatus[]
}

interface ServiceDashboardPopupState {
  visible: boolean
  initialStatuses: ServiceStatus[]
  isLoading: boolean
}
export const ServiceDashboardPopup: React.FC<ServiceDashboardPopupProps> = ({
  onServiceStatus,
  companyHealthStatuses
}) => {
  const [state, setState] = useState<ServiceDashboardPopupState>({
    visible: false,
    initialStatuses: [],
    isLoading: StatusAPIs.isLoading
  })
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
        if(onServiceStatus) {
          onServiceStatus(statuses)
        }
    })
  },[])
  const onViewDashboard = () => {
    setState({
      ...state,
      visible: true
    })
  }
  return (
    <div>
      <Button className="app-button"
        onClick={() => onViewDashboard()}
        disabled={state.isLoading}
      >{state.isLoading ? 'Loading' : 'View'} Service Dashboard</Button>
      {state.visible && <ServiceDashboard 
        title={'Service Status Dashboard'}
        companyHealthStatuses={companyHealthStatuses}
        initialStatuses={state.initialStatuses}
        onServiceStatus={onServiceStatus}
      />}
    </div>
  )


}
export default ServiceDashboard