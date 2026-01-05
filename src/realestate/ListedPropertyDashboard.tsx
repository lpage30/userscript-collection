import React, { useState, JSX, useEffect, useRef, BaseSyntheticEvent } from 'react'
import { Button } from 'primereact/button';
import { PropertyInfo } from './realestatesitetypes'
import Dashboard from '../dashboardcomponents/Dashboard'
import { FilterableItems, ItemFilter, CardShellContainerId } from '../dashboardcomponents/datatypes';
import { Persistence } from '../dashboardcomponents/persistence';

export const ListedPropertyContainerId = CardShellContainerId
export const sortingFields = ['PriceValue', 'OceanDistance'];
export const getFilterableItems = (propertyInfo: PropertyInfo[]): FilterableItems => (
  {
    PriceValue: {
      field: 'PriceValue',
      type: 'ValueRange', 
      displayData: { mode: 'currency', currency: 'USD', locale: 'en-US' , maxWidth: 10, step: 50000 },
      filter: propertyInfo
        .map(({ PriceValue }) => PriceValue).sort()
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
      displayData: { mode: 'decimal', suffix: ' mi', maxWidth: 5, step: 0.25 },
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

interface ListedPropertyDashboardProps {
  title: string
  siteName: string
  properties: PropertyInfo[]
  onClose: () => void
  registerRefreshFunction?: (refreshFunction: (showDialog: boolean) => void) => void
  ignoreClickEvent?: (e: BaseSyntheticEvent) => boolean
  addedHeaderComponent?: {
    after: 'picklist' | 'infodisplay' | 'filtersort' | 'lastrow',
    element: JSX.Element,
  }
}
interface ListedPropertyDashboardState {
  properties: PropertyInfo[]
}

export const ListedPropertyDashboard: React.FC<ListedPropertyDashboardProps> = ({
  title,
  siteName,
  properties,
  onClose,
  registerRefreshFunction,
  ignoreClickEvent,
  addedHeaderComponent
}) => {
  const refreshDashboardRef = useRef<(showDialog: boolean) => void>(null)
  const filterableItems = getFilterableItems(properties)
  if (registerRefreshFunction) registerRefreshFunction((showDialog: boolean) => {
    if (refreshDashboardRef.current) refreshDashboardRef.current(showDialog)
  })

  return <Dashboard
    title={title}
    getPersistence={() => Persistence(siteName, () => filterableItems)}
    pageTypes={['dashboard']}
    getFilterableItems={() => filterableItems}
    sortingFields={sortingFields}
    page={'dashboard'}
    getCards={() => properties}
    cardStyle={{ height: '500px', width: '600px' }}
    layout={'grid-2'}
    onClose={onClose}
    registerRefreshFunction={(refreshFunction) => refreshDashboardRef.current = refreshFunction}
    ignoreClickEvent={ignoreClickEvent}
    addedHeaderComponent={addedHeaderComponent}
  />
}

interface ListedPropertyDashboardPopupProps {
  title: string
  siteName: string
  properties: PropertyInfo[]
  onDashboardClose: () => void
  registerOpen?: (closeDashboard: () => void) => void
  registerClose?: (closeDashboard: () => void) => void
  ignoreDashboardClickEvent?: (e: BaseSyntheticEvent) => boolean
  addedDashboardHeaderComponent?: {
    after: 'picklist' | 'infodisplay' | 'filtersort' | 'lastrow',
    element: JSX.Element,
  }

}
interface ListedPropertyDashboardPopupState {
  visible: boolean
}

export const ListedPropertyDashboardPopup: React.FC<ListedPropertyDashboardPopupProps> = ({
  title,
  siteName,
  properties,
  onDashboardClose,
  addedDashboardHeaderComponent,
  registerOpen,
  registerClose,
  ignoreDashboardClickEvent,

}) => {
  const refreshDashboardRef = useRef<(showDialog: boolean) => void>(null)
  const [state, setState] = useState<ListedPropertyDashboardPopupState>({
    visible: false
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
    return (<>
      <Button
        className={'app-button'}
        onClick={toggleDashboard}
      >Toggle {title}</Button>
      {state.visible && <ListedPropertyDashboard
        title={title}
        siteName={siteName}
        properties={properties}
        onClose={closeDashboard}
        registerRefreshFunction={(refreshFunction: (showDialog: boolean) => void) => {
          refreshDashboardRef.current = refreshFunction
        }}
        ignoreClickEvent={ignoreDashboardClickEvent}
        addedHeaderComponent={addedDashboardHeaderComponent}
      />
      }
    </>)
  }
  return render()
}