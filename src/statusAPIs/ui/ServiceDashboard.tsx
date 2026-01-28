import React, { useState, useRef, useEffect, JSX } from 'react'
import { Button } from 'primereact/button'
import { CompanyHealthStatus } from '../../common/CompanyHealthStatus'
import { ServiceStatus, isServiceStatusForAnyCompanies } from '../statustypes'
import { Card } from '../../dashboardcomponents/datatypes'
import { Dashboard } from '../../dashboardcomponents/Dashboard'
import { StatusAPIs } from '../statusAPIs'
import { toServiceStatusCard } from '../statustypes'
import { ServiceStatusComponent } from './ServiceStatusComponent'
import { getSortedStatusLevels, sortServiceByStatusIndicatorRank } from '../statusService'
import { createSpinningContentElement } from '../../common/ui/style_functions'
import { reactToHTMLElement } from '../../common/ui/renderRenderable'
import { MultirowElement } from '../../common/ui/multirow_element'
import { statusLevelToMultrowElement, serviceStatusToMultirowElement } from './multirowElementConversions'

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
  companyHealthStatuses,
  statusesPerRow = 10,

}) => {
  const [state, setState] = useState<ServiceDashboardPopupState>({
    visible: false,
    initialStatuses: [],
    isLoading: StatusAPIs.isLoading,
    dashboardVisible: false
  })
  const refreshDashboardRef = useRef<(showDialog: boolean, force: boolean) => Promise<void>>(null)
  const setFocusRef = useRef<(elementId: string) => void>(null)

  StatusAPIs.registerOnIsLoadingChange((isLoading: boolean) => {
    setState({
      ...state,
      isLoading
    })
  })
  useEffect(() => {
    StatusAPIs.load(false).then(statuses => {
      const cardStatuses = statuses.map(toServiceStatusCard).map(c => c as ServiceStatus)
      if (onServiceStatus) {
        onServiceStatus(cardStatuses)
      }
      setState({
        ...state,
        initialStatuses: cardStatuses
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
            getCards={() => state
              .initialStatuses
              .sort((l: ServiceStatus, r: ServiceStatus) => {
                const order1 = (r.status.statusLevel ?? 0) - (l.status.statusLevel ?? 0)
                return 0 != order1 ? order1 : l.serviceName.localeCompare(r.serviceName)
              }).map(s => s as Card)}
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
            registerSetFocusFunction={setFocusFunction => setFocusRef.current = setFocusFunction}
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
                      <MultirowElement
                        items={getSortedStatusLevels().map(statusLevelToMultrowElement)}
                        titleElement={<span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Legend:</span>}
                        itemsPerRow={statusesPerRow}
                      />
                      <MultirowElement
                        items={state.initialStatuses.map(serviceStatusToMultirowElement)}
                        titleElement={<span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Services:</span>}
                        itemsPerRow={statusesPerRow}
                        onClick={(elementId: string) => {
                          if (setFocusRef.current) setFocusRef.current(elementId)
                        }}
                      />
                    </tbody>
                  </table>
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
  const [statuses, setStatuses] = useState<ServiceStatus[]>([])

  const setServiceStatus = (serviceStatus: ServiceStatus[]) => {
    const displayStatus = [...serviceStatus]
      .filter(status => {
        return undefined === isolatedCompanyNames ||
          0 === isolatedCompanyNames.length ||
          isServiceStatusForAnyCompanies(status, isolatedCompanyNames)
      })
      .sort(sortServiceByStatusIndicatorRank)
    setStatuses(displayStatus)
    if (onServiceStatus) onServiceStatus(serviceStatus)
  }
  const render = () => {
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
              <MultirowElement
                items={getSortedStatusLevels().map(statusLevelToMultrowElement)}
                titleElement={<span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Legend:</span>}
                itemsPerRow={statusesPerRow}
              />
              <MultirowElement
                items={statuses.map(serviceStatusToMultirowElement)}
                titleElement={<span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Services:</span>}
                itemsPerRow={statusesPerRow}
              />
            </tbody>
          </table>
        )}
      </div>
    )
  }
  return render()
}