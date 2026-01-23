import React, { useState, useRef, useEffect, JSX, CSSProperties } from 'react'
import { Button } from 'primereact/button'
import { Dashboard } from '../../dashboardcomponents/Dashboard'
import { Card } from '../../dashboardcomponents/datatypes'
import { reactToHTMLElement } from '../../common/ui/renderRenderable'
import { createSpinningContentElement } from '../../common/ui/style_functions'
import { OutageBreakdown, toOutageBreakdownCard } from '../outageBreakdownAPItypes'
import { OutageBreakdownAPI } from '../OutageBreakdownAPI'
import { OutageBreakdownSpan } from './OutageBreakdownListing'
import { OutageBreakdownComponent } from './OutageBreakdownComponent'

interface OutageBreakdownDashboardPopupProps {
  onOutageBreakdowns?: (outageBreakdowns: OutageBreakdown[]) => void
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
}) => {
  const [state, setState] = useState<OutageBreakdownDashboardPopupState>({
    visible: false,
    initialBreakdowns: [],
    isLoading: OutageBreakdownAPI.isLoading,
    dashboardVisible: false
  })
  const refreshDashboardRef = useRef<(showDialog: boolean, force: boolean) => Promise<void>>(null)
  OutageBreakdownAPI.registerOnIsLoadingChange((isLoading: boolean) => {
    setState({
      ...state,
      isLoading
    })
  })
  useEffect(() => {
    OutageBreakdownAPI.load(false).then(breakdowns => {
      if (onOutageBreakdowns) {
        onOutageBreakdowns(breakdowns)
      }
      setState({
        ...state,
        initialBreakdowns: breakdowns
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
            getCards={() => state.initialBreakdowns.map(toOutageBreakdownCard)}
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
  outagesPerRow = 10,
}) => {
  const [outages, setOutages] = useState<OutageBreakdown[][]>([])

  const setOutageBreakdowns = (outageBreakdowns: OutageBreakdown[]) => {
    const displayOutages = [...outageBreakdowns]
      .reduce((rows, breakdown, index) => {
        if (0 === (index % outagesPerRow)) {
          rows.push([])
        }
        rows[rows.length - 1].push(breakdown)
        return rows
      }, [] as OutageBreakdown[][])

    setOutages(displayOutages)
    if (onOutageBreakdowns) onOutageBreakdowns(outageBreakdowns)
  }
  const render = () => {
    const outageRows = outages.map(outageRow => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {outageRow.map((outage, index) => (
          <>
            {0 < index && <span className="text-sm">&nbsp;&#x2022;&nbsp;</span>}
            {OutageBreakdownSpan(
              outage,
              0 < index ? 5 : 3,
              (index + 1) < outages.length ? 5 : 3
            )}
          </>
        ))}
      </div>
    ))
    return (
      <div style={{ display: 'flex' }}>
        <OutageBreakdownDashboardPopup
          onOutageBreakdowns={setOutageBreakdowns}
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
              <tr style={{ alignItems: 'center', verticalAlign: 'bottom' }}>
                <td style={{ textAlign: 'right' }}><span className="text-sm" style={{ paddingLeft: '5px', paddingRight: '5px' }}>Services:</span></td>
                <td>{outageRows[0]}</td>
              </tr>
              {outageRows.slice(1).map(row => (
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