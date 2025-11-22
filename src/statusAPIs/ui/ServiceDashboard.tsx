import React, { useState, useEffect, useRef} from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Status, ServiceStatus } from '../statustypes'
import { StatusAPIs } from '../statusAPIs'
import ServiceStatusComponent from './ServiceStatusComponent'

interface ServiceDashboardProps {
  title: string
  initialStatuses: ServiceStatus[]
  onServiceStatus?: (serviceStatus: { [service: string]: Status }) => void
  registerRefreshFunction?: (refreshFunction: (showDialog: boolean) => Promise<void>) => void
  onVisibleChange?: (visible: boolean) => void
  initiallyVisible?: boolean
}
interface ServiceDashboardState {
  visible: boolean
  statuses: ServiceStatus[]
  status: { [service: string]: Status }
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
    statuses: initialStatuses, 
    status: {}
  })

  const refresh = async (showDialog: boolean): Promise<void> => {
    const statuses = await StatusAPIs.load()
    const status = statuses.reduce((result, data) => ({
      ...result,
      [data.serviceName]: data.status
    }), {} as { [service: string]: Status })
    setState({
      visible: showDialog,
      statuses,
      status
    })
    if (onServiceStatus) onServiceStatus(status)
    if (registerRefreshFunction) registerRefreshFunction(refresh)
    if (onVisibleChange) onVisibleChange(showDialog)
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
                  <Button onClick={() => refresh(true)}>Refresh Service Statuses</Button>
              </td>
            </tr>
          </tbody></table>
      }
      className='p-dialog-maximized'
    >
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
      {state.statuses.map(serviceStatus => (
        <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
          <td>
            <ServiceStatusComponent serviceStatus={serviceStatus}/>
          </td>
        </tr>
      ))}
      </tbody>
      </table>
    </Dialog>
  )
}
interface ServiceDashboardPopupProps {
  onServiceStatus?: (serviceStatus: { [service: string]: Status }) => void
}

export const ServiceDashboardPopup: React.FC<ServiceDashboardPopupProps> = ({
  onServiceStatus,
}) => {
  const [initialStatuses, setInitialStatuses] = useState<ServiceStatus[]>([])
  const [visible, setVisible] = useState<boolean>(false)
  const refreshFunctionRef = useRef<(showDialog: boolean) => Promise<void>>(null)
  useEffect(() => {
    StatusAPIs.load().then(statuses => {
        setInitialStatuses(statuses)
        if(onServiceStatus) {
          onServiceStatus(statuses.reduce((result, data) => ({
            ...result,
            [data.serviceName]: data.status
          }), {} as { [service: string]: Status }))
        }
    })
  },[])
  const onViewDashboard = () => {
    if(refreshFunctionRef.current) {
      refreshFunctionRef.current(true)
    } else {
      setVisible(true)
    }
  }
  return (
    <div>
      <Button className="app-button" onClick={() => onViewDashboard()}>View Service Dashboard</Button>
      {visible && <ServiceDashboard 
        title={'Service Status Dashboard'}
        initialStatuses={initialStatuses}
        onServiceStatus={onServiceStatus}
        registerRefreshFunction={(refreshFunction: (showDialog: boolean) => Promise<void>) => refreshFunctionRef.current = refreshFunction}
        onVisibleChange={(showDashboard: boolean) => setVisible(showDashboard)}
      />}
    </div>
  )


}
export default ServiceDashboard