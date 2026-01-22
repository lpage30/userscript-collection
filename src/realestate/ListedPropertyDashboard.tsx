import React, { useState, JSX, useRef } from 'react'
import "../common/ui/styles.scss";
import { Button } from 'primereact/button';
import { PropertyInfo } from './propertyinfotypes'
import Dashboard from '../dashboardcomponents/Dashboard'
import { FilterableItems, ItemFilter, CardShellContainerId } from '../dashboardcomponents/datatypes';
import { Persistence } from '../dashboardcomponents/persistence';
import { toPropertyCardDashboardComponent } from './PropertyInfoCard';

export const ListedPropertyContainerId = CardShellContainerId
export const sortingFields = ['Price', 'DistanceToOcean'];
export const getFilterableItems = (propertyInfo: PropertyInfo[]): FilterableItems => (
  {
    Price: {
      field: 'Price',
      type: 'ValueRange',
      displayData: {
        step: 50000,
        prefix: propertyInfo[0].currencySymbol,
        formatValue: (value: number) => value.toLocaleString(undefined)
      },
      filter: propertyInfo
        .map(({ Price }) => Price).sort()
        .filter(value => ![undefined, null].includes(value))
        .filter((value, index, array) => index === 0 || array[index - 1] !== value)
        .reduce((result, value) => ({
          minValue: Math.min(value, result.minValue),
          maxValue: Math.max(value, result.maxValue)
        }), { minValue: Number.MAX_VALUE, maxValue: 0 } as { minValue: number, maxValue: number })
    } as unknown as ItemFilter,
    DistanceToOcean: {
      field: 'DistanceToOcean',
      type: 'ValueRange',
      displayData: {
        suffix: ' mi',
        step: 0.25,
        formatValue: (value: number) => value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      },
      filter: propertyInfo
        .map(({ DistanceToOcean }) => DistanceToOcean).sort()
        .filter(value => ![undefined, null].includes(value))
        .filter((value, index, array) => index === 0 || array[index - 1] !== value)
        .reduce((result, value) => ({
          minValue: Math.min(value, result.minValue),
          maxValue: Math.max(value, result.maxValue)
        }), { minValue: Number.MAX_VALUE, maxValue: 0 } as { minValue: number, maxValue: number })
    } as unknown as ItemFilter,
  })

interface ListedPropertyDashboardPopupProps {
  title: string
  siteName: string
  properties: PropertyInfo[]
  onDashboardClose: () => void
  registerOpen?: (closeDashboard: () => void) => void
  registerClose?: (closeDashboard: () => void) => void
  registerRefreshFunction?: (refreshFunction: (showDialog: boolean) => void) => void
  addedDashboardHeaderComponent?: {
    after: 'picklist' | 'infodisplay' | 'filtersort' | 'lastrow',
    element: JSX.Element,
  }

}
interface ListedPropertyDashboardPopupState {
  visible: boolean,
  properties: PropertyInfo[]
}

export const ListedPropertyDashboardPopup: React.FC<ListedPropertyDashboardPopupProps> = ({
  title,
  siteName,
  properties,
  onDashboardClose,
  addedDashboardHeaderComponent,
  registerOpen,
  registerClose,
  registerRefreshFunction,
}) => {
  const refreshDashboardRef = useRef<(showDialog: boolean) => void>(null)
  const [state, setState] = useState<ListedPropertyDashboardPopupState>({
    visible: false,
    properties
  })
  if (registerRefreshFunction) registerRefreshFunction((showDialog: boolean) => {
    if (refreshDashboardRef.current) refreshDashboardRef.current(showDialog)
  })

  const openDashboard = () => {
    setState({ ...state, visible: true })
    if (refreshDashboardRef.current) refreshDashboardRef.current(true)
  }
  const closeDashboard = () => {
    setState({ ...state, visible: false })
    if (refreshDashboardRef.current) refreshDashboardRef.current(false)
    onDashboardClose()
  }
  const toggleDashboard = () => {
    if (state.visible) {
      closeDashboard()
    } else {
      openDashboard()
    }
  }
  if (registerClose) {
    registerClose(closeDashboard)
  }
  if (registerOpen) {
    registerOpen(openDashboard)
  }

  const render = () => {
    const filterableItems = getFilterableItems(state.properties)
    return (<>
      <Button
        className={'app-button'}
        onClick={toggleDashboard}
      >Toggle {title}</Button>
      {state.visible && <Dashboard
        title={title}
        getPersistence={() => Persistence(siteName, () => filterableItems)}
        pageTypes={['dashboard']}
        getFilterableItems={() => filterableItems}
        sortingFields={sortingFields}
        page={'dashboard'}
        getCards={() => state.properties}
        toCardComponent={toPropertyCardDashboardComponent}
        cardStyle={{ height: '520px', width: '600px' }}
        layout={'grid-2'}
        onClose={closeDashboard}
        registerRefreshFunction={(refreshFunction) => refreshDashboardRef.current = refreshFunction}
        addedHeaderComponents={[addedDashboardHeaderComponent]}
        infoDisplayRowSpan={2}
        infoDisplayTextPaddingLeft={{ value: 0.5, type: 'rem' }}
      />}
    </>)
  }
  return render()
}