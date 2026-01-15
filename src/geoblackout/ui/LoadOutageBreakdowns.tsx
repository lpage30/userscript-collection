import React, { useState, useEffect, JSX } from 'react'
import { Button } from 'primereact/button'
import { OutageBreakdown } from '../outageBreakdownAPItypes'
import { OutageBreakdownAPI } from '../OutageBreakdownAPI'
import { createSpinningContentElement } from '../../common/ui/style_functions'

interface LoadOutageBreakdownsProps {
  onOutageBreakdowns: (breakdowns: OutageBreakdown[]) => void
}
interface LoadOutageBreakdownsState {
  isLoading: boolean
  breakdowns: OutageBreakdown[]
}

export const LoadOutageBreakdowns: React.FC<LoadOutageBreakdownsProps> = ({
  onOutageBreakdowns,
}) => {
  const [state, setState] = useState<LoadOutageBreakdownsState>({
    isLoading: OutageBreakdownAPI.isLoading,
    breakdowns: []
  })
  OutageBreakdownAPI.registerOnIsLoadingChange((isLoading: boolean) => {
    setState({
      ...state,
      isLoading
    })
  })
  useEffect(() => {
    loadBreakdowns(false)
  }, [])

  const loadBreakdowns = async (force: boolean) => {
    const newBreakdowns = await OutageBreakdownAPI.load(force)
    setState({
      ...state,
      breakdowns: newBreakdowns
    })
    onOutageBreakdowns(newBreakdowns)
  }

  const onRefreshBreakdowns = () => {
    loadBreakdowns(true)
  }

  const render = () => {
    let buttonContent: string | JSX.Element = 'Refresh Breakdowns'
    if (state.isLoading) {

      buttonContent = createSpinningContentElement({
        popupElementType: 'NoPopup',
        spinnerSize: 'small',
        content: {
          content: 'Loading Outage Breakdowns'
        }
      })
    }
    return (
      <Button
        className="app-button"
        onClick={() => onRefreshBreakdowns()}
        disabled={state.isLoading}
      >{buttonContent}</Button>
    )
  }
  return render()

}
