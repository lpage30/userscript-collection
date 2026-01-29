import React, { useState, useRef, useEffect, JSX } from 'react'
import { Button } from 'primereact/button'
import { Dashboard } from '../../dashboardcomponents/Dashboard'
import { Card } from '../../dashboardcomponents/datatypes'
import { reactToHTMLElement } from '../../common/ui/renderRenderable'
import { createSpinningContentElement } from '../../common/ui/style_functions'
import { OutageBreakdown, toOutageBreakdownCard } from '../outageBreakdownAPItypes'
import { OutageBreakdownAPI } from '../OutageBreakdownAPI'
import { OutageBreakdownSpan } from './OutageBreakdownListing'
import { OutageBreakdownComponent } from './OutageBreakdownComponent'
import { MultirowElement, MultirowArrayItem } from '../../common/ui/multirow_element'
import { CompanyHealthStatus, CompanyHealthLevelTypeInfoMap, CompanyHealthStatusSort } from '../../common/CompanyHealthStatus'

const outageToMultirowArrayItem = (outage: OutageBreakdown): MultirowArrayItem => ({
  id: outage.elementId,
  getElement: (isFirst: boolean, isLast: boolean, onClick?: () => void) => (<>
    {!isFirst && <span className="text-sm">&nbsp;&#x2022;&nbsp;</span>}
    {OutageBreakdownSpan(
      outage,
      !isFirst ? 5 : 3,
      !isLast ? 5 : 3,
      false,
      onClick
    )}
  </>)
})

interface OutageBreakdownDashboardPopupProps {
  onOutageBreakdowns?: (outageBreakdowns: OutageBreakdown[]) => void
  companyHealthStatuses?: CompanyHealthStatus[]
  outagesPerRow?: number
}

interface OutageBreakdownDashboardPopupState {
  visible: boolean
  initialBreakdowns: OutageBreakdown[]
  isLoading: boolean
  dashboardVisible: boolean
}
export const OutageBreakdownDashboardPopup: React.FC<OutageBreakdownDashboardPopupProps> = ({
  onOutageBreakdowns,
  companyHealthStatuses,
  outagesPerRow = 10,
}) => {
  const [state, setState] = useState<OutageBreakdownDashboardPopupState>({
    visible: false,
    initialBreakdowns: [],
    isLoading: OutageBreakdownAPI.isLoading,
    dashboardVisible: false
  })
  const refreshDashboardRef = useRef<(showDialog: boolean, force: boolean) => Promise<void>>(null)
  const setFocusRef = useRef<(elementId: string) => void>(null)

  OutageBreakdownAPI.registerOnIsLoadingChange((isLoading: boolean) => {
    setState({
      ...state,
      isLoading
    })
  })
  useEffect(() => {
    OutageBreakdownAPI.load(false).then(breakdowns => {
      const cardBreakdowns = breakdowns
        .map(toOutageBreakdownCard)
        .map(c => c as OutageBreakdown)
        .sort((l: OutageBreakdown, r: OutageBreakdown) => l.service.localeCompare(r.service))
      if (onOutageBreakdowns) {
        onOutageBreakdowns(cardBreakdowns)
      }
      const orderedCompanyStatuses = (companyHealthStatuses ?? []).sort(CompanyHealthStatusSort)
      const orderedBreakdownServiceNames: string[] = []
      orderedCompanyStatuses.filter(({ outageBreakdownService }) => undefined !== outageBreakdownService).forEach(({ outageBreakdownService }) => {
        const breakdown = cardBreakdowns.find(breakdown => breakdown.service === outageBreakdownService.service)
        orderedBreakdownServiceNames.push(breakdown.service)
      })
      orderedBreakdownServiceNames.push(...cardBreakdowns.map(({ service }) => service).filter(service => !orderedBreakdownServiceNames.includes(service)))
      setState({
        ...state,
        initialBreakdowns: orderedBreakdownServiceNames.map(serviceName => cardBreakdowns.find(({ service }) => serviceName === service))
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

    let buttonContent = (action: string): string | JSX.Element => `${action} Breakdown Dashboard`
    if (state.isLoading) {

      buttonContent = (action: string): string | JSX.Element => createSpinningContentElement({
        popupElementType: 'NoPopup',
        spinnerSize: 'small',
        content: {
          content: 'Loading Breakdown Dashboard'
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
            title={'Outage Breakdown Dashboard'}
            getCards={() => state.initialBreakdowns.map(s => s as Card)}
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
                    <OutageBreakdownComponent
                      outageBreakdown={card as OutageBreakdown}
                      companyHealthStatuses={companyHealthStatuses}
                    />)
              }
            }}
            cardLoadingAPI={OutageBreakdownAPI}
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
            onCardsLoaded={cards => { if (onOutageBreakdowns) onOutageBreakdowns(cards.map(c => c as OutageBreakdown)) }}
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
                        items={state.initialBreakdowns.map(outageToMultirowArrayItem)}
                        itemsPerRow={outagesPerRow}
                        titleElement={<span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Services:</span>}
                        onClick={(elementId: string) => { if (setFocusRef.current) setFocusRef.current(elementId) }}
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

interface OutageBreakdownDashboardPopupAndSummaryProps extends OutageBreakdownDashboardPopupProps {
}

export const OutageBreakdownDashboardPopupAndSummary: React.FC<OutageBreakdownDashboardPopupAndSummaryProps> = ({
  onOutageBreakdowns,
  companyHealthStatuses,
  outagesPerRow = 10,
}) => {
  const [outages, setOutages] = useState<OutageBreakdown[]>([])

  const setOutageBreakdowns = (outageBreakdowns: OutageBreakdown[]) => {
    setOutages(outageBreakdowns)
    if (onOutageBreakdowns) onOutageBreakdowns(outageBreakdowns)
  }
  const render = () => {
    return (
      <div style={{ display: 'flex' }}>
        <OutageBreakdownDashboardPopup
          onOutageBreakdowns={setOutageBreakdowns}
          companyHealthStatuses={companyHealthStatuses}
        />
        {0 < outages.length && (
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
                items={outages.map(outageToMultirowArrayItem)}
                itemsPerRow={outagesPerRow}
                titleElement={<span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Services:</span>}
              />
            </tbody>
          </table>
        )}
      </div>
    )
  }
  return render()
}