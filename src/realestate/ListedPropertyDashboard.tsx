import React, { useState, JSX, useEffect, useRef, BaseSyntheticEvent } from 'react'
import { Button } from 'primereact/button';
import { PropertyInfo } from './realestate_site'
import Dashboard from '../dashboardcomponents/Dashboard'
import { FilterableItems, ItemFilter, CardShellContainerId } from '../dashboardcomponents/datatypes';
import { Persistence } from '../dashboardcomponents/persistence';

export const ListedPropertyContainerId = CardShellContainerId
export const sortingFields = ['Price', 'City', 'State'];
export const getFilterableItems = (propertyInfo: PropertyInfo[]): FilterableItems => (
  {
    City: {
      field: 'City',
      type: 'ValueExistence',
      filter: propertyInfo
        .map(({ City }) => City).sort()
        .filter(city => ![undefined, null].includes(city))
        .filter((city, index, array) => index === 0 || array[index - 1] !== city)
        .reduce((result, city) => ({
          ...result,
          [city]: true
        }), {} as { [value: string]: boolean })
    } as ItemFilter,
    State: {
      field: 'State',
      type: 'ValueExistence',
      filter: propertyInfo
        .map(({ State }) => State).sort()
        .filter(state => ![undefined, null].includes(state))
        .filter((state, index, array) => index === 0 || array[index - 1] !== state)
        .reduce((result, state) => ({
          ...result,
          [state]: true
        }), {} as { [value: string]: boolean })
    } as ItemFilter,
  })

interface ListedPropertyDashboardProps {
  title: string
  siteName: string
  initialProperties: PropertyInfo[]
  loadListedPropertyInfo: () => Promise<PropertyInfo[]>
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
  initialProperties,
  loadListedPropertyInfo,
  onClose,
  registerRefreshFunction,
  ignoreClickEvent,
  addedHeaderComponent
}) => {
  const refreshDashboardRef = useRef<(showDialog: boolean) => void>(null)

  const [state, setState] = useState<ListedPropertyDashboardState>({
    properties: initialProperties
  })
  if (registerRefreshFunction) registerRefreshFunction((showDialog: boolean) => {
    if (showDialog) reloadCards()
  })
  useEffect(() => {
    reloadCards()
  }, [])
  const reloadCards = async () => {
    const properties = await loadListedPropertyInfo()
    setState({
      ...state,
      properties
    })
    if (refreshDashboardRef.current) refreshDashboardRef.current(true)
  }
  const getCards = () => {
    return state.properties
  }
  const getPersistence = () => {
    return Persistence(siteName, () => getFilterableItems(getCards()))
  }

  return <Dashboard
    title={title}
    getPersistence={getPersistence}
    pageTypes={['dashboard']}
    getFilterableItems={() => getFilterableItems(getCards())}
    sortingFields={sortingFields}
    page={'dashboard'}
    getCards={getCards}
    cardStyle={{height: '500px', width: '600px'}}
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
  initialProperties: PropertyInfo[]
  loadListedPropertyInfo: () => Promise<PropertyInfo[]>
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
  initialProperties,
  loadListedPropertyInfo,
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
        initialProperties={initialProperties}
        loadListedPropertyInfo={loadListedPropertyInfo}
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