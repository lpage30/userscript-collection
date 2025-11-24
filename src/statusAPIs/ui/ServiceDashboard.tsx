import React, { useState, useEffect, useRef} from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Status, ServiceStatus } from '../statustypes'
import { StatusAPIs } from '../statusAPIs'
import ServiceStatusComponent from './ServiceStatusComponent'

interface ServiceDashboardProps {
  title: string
  initialStatuses: ServiceStatus[]
  onServiceStatus?: (serviceStatus: ServiceStatus[]) => void
  registerRefreshFunction?: (refreshFunction: (showDialog: boolean, force: boolean) => Promise<void>) => void
  onVisibleChange?: (visible: boolean) => void
  initiallyVisible?: boolean

}
interface ServiceDashboardState {
  visible: boolean
  isLoading: boolean
  statuses: ServiceStatus[]
}
const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  title,
  onServiceStatus,
  registerRefreshFunction,
  onVisibleChange,
  initialStatuses
}) => {
  const [state, setState] = useState<ServiceDashboardState>({
    visible: true,
    isLoading: StatusAPIs.isLoading,
    statuses: initialStatuses
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
              <td className="text-center">
                <h2>{title}</h2>
              </td>
            </tr>
            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
              <td>
                  <Button
                    onClick={() => refresh(true, true)}
                    disabled={state.isLoading}>{state.isLoading ? 'Loading' : 'Refresh'} Service Statuses</Button>
              </td>
            </tr>
          </tbody></table>
      }
      className='p-dialog-maximized'
    >
      {state.statuses.map((serviceStatus, index) => (<>
        {0 < index && <hr/>}
        <ServiceStatusComponent serviceStatus={serviceStatus}/>
      </>))}
    </Dialog>
  )
}
interface ServiceDashboardPopupProps {
  onServiceStatus?: (serviceStatus: ServiceStatus[]) => void
}

interface ServiceDashboardPopupState {
  visible: boolean
  initialStatuses: ServiceStatus[]
  isLoading: boolean
}
export const ServiceDashboardPopup: React.FC<ServiceDashboardPopupProps> = ({
  onServiceStatus,
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
        initialStatuses={state.initialStatuses}
        onServiceStatus={onServiceStatus}
      />}
    </div>
  )


}
export default ServiceDashboard