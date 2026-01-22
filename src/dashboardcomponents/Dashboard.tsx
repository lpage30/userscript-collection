import React, { useState, useEffect, useRef, CSSProperties, JSX } from 'react';
import '../common/ui/styles.scss';
import { Dialog } from 'primereact/dialog';
import { awaitElementById } from '../common/await_functions';
import {
  Card,
  FilterableItems,
  InfoDisplayItem,
  toCardElementId, fromCardElementId, toCardIndex,
  SortedFilteredItems, sortAndFilterItems,
  ItemSort, ItemFilter, CardShellContainerId,
  s
} from './datatypes';
import { PersistenceClass } from './persistence';
import Picklist from './PickList';
import InfoDisplay, { Padding } from './InfoDisplay';
import FilterSort from './FilterSort';
import CardShell from './CardShell';

export type DashboardLayout = 'vertical' | 'horizontal' | 'grid' | 'grid-2' | 'grid-3' | 'grid-4'
export interface AddedHeaderComponent {
  after: 'picklist' | 'infodisplay' | 'filtersort' | 'lastrow',
  element: JSX.Element,
}
interface DashboardProps {
  title: string
  getPersistence: () => PersistenceClass
  pageTypes: string[]
  getFilterableItems: () => FilterableItems;
  sortingFields: string[];
  page: string
  getCards: () => Card[];
  toCardComponent: (card: Card) => HTMLElement
  style?: CSSProperties
  cardStyle?: CSSProperties
  layout?: DashboardLayout
  registerRefreshContent?: (refreshContent: () => void) => void
  registerRefreshFunction?: (refreshFunction: (showDialog: boolean) => void) => void
  onClose?: () => void
  addedHeaderComponents?: AddedHeaderComponent[]
  closeable?: boolean
  infoDisplayRowSpan?: number
  infoDisplayTextPaddingLeft?: Padding
  infoDisplayTitlePaddingLeft?: Padding

}
interface DashboardState {
  visible: boolean
  selectedItem: Card | null
}
const Dashboard: React.FC<DashboardProps> = ({
  title,
  getPersistence,
  pageTypes,
  getFilterableItems,
  sortingFields,
  page,
  getCards,
  toCardComponent,
  style,
  cardStyle,
  layout = 'grid',
  registerRefreshContent,
  registerRefreshFunction,
  onClose,
  addedHeaderComponents,
  closeable = true,
  infoDisplayRowSpan = 1,
  infoDisplayTextPaddingLeft,
  infoDisplayTitlePaddingLeft,
}) => {
  const persistence = useRef<PersistenceClass>(getPersistence())
  const triggerInfoDisplayRef = useRef<(displayItem: InfoDisplayItem | null) => void>(null)
  const infoDisplayCloseDelayMs = 5000
  const clearInfoDisplayTimeoutId = useRef<NodeJS.Timeout>(null)

  const [sortedFilteredItems, setSortedFilteredItems] = useState<SortedFilteredItems<Card>>(sortAndFilterItems(getCards(), getFilterableItems(), {
    filter: Object.entries(getFilterableItems()).map(([field, itemFilter]) => persistence.current.loadFilter().find(loaded => loaded.field === field) ?? itemFilter),
    sorting: persistence.current.loadSorting()
  }))
  const [state, setState] = useState<DashboardState>({
    visible: true,
    selectedItem: null,
  })
  const setInfoDisplay = (itemIndex: number) => {
    if (clearInfoDisplayTimeoutId.current) {
      const timeoutId = clearInfoDisplayTimeoutId.current
      clearInfoDisplayTimeoutId.current = null
      clearTimeout(timeoutId)
    }
    let item: Card | null = null
    if (itemIndex < sortedFilteredItems.filteredItems.length) {
      item = sortedFilteredItems.filteredItems[itemIndex]
    }
    if (item) {
      if (triggerInfoDisplayRef.current) {
        triggerInfoDisplayRef.current(item)
      }
      setState({ ...state, selectedItem: item })
    } else {
      clearInfoDisplay()
    }

  }
  const clearInfoDisplay = () => {
    if (clearInfoDisplayTimeoutId.current) {
      const timeoutId = clearInfoDisplayTimeoutId.current
      clearInfoDisplayTimeoutId.current = null
      clearTimeout(timeoutId)
    }
    clearInfoDisplayTimeoutId.current = setTimeout(() => {
      setState({ ...state, selectedItem: null })
      if (triggerInfoDisplayRef.current) {
        triggerInfoDisplayRef.current(null)
      }
    }, infoDisplayCloseDelayMs)
  }

  const focusedElementIdRef = useRef<string>(null)
  if (registerRefreshContent) registerRefreshContent(() => refreshContent())
  if (registerRefreshFunction) registerRefreshFunction((showDialog: boolean) => {
    refreshContent()
    setState({ ...state, visible: showDialog })
  })

  const refreshCards = async () => {
    await awaitElementById(toCardElementId(sortedFilteredItems.sortedItems.length - 1))
    sortedFilteredItems.sortedItems.forEach((_item, index) => {
      const cardParent = document.getElementById(toCardElementId(index));
      if (cardParent.firstChild) {
        cardParent.removeChild(cardParent.firstChild)
      }
    });
    sortedFilteredItems.filteredItems.forEach((item, index) => {
      const cardParent = document.getElementById(toCardElementId(index));
      cardParent.appendChild(toCardComponent(item))
    });
  };
  useEffect(() => {
    refreshCards();
  }, [sortedFilteredItems]);

  const refreshContent = () => {
    const cards = getCards()
    const filterableItems = getFilterableItems()
    persistence.current = getPersistence()
    sortAndFilterItems(cards, filterableItems, {
      filter: Object.entries(filterableItems).map(([field, itemFilter]) => persistence.current.loadFilter().find(loaded => loaded.field === field) ?? itemFilter),
      sorting: persistence.current.loadSorting()
    })
    setSortedFilteredItems(sortAndFilterItems(getCards(), filterableItems, sortedFilteredItems.sortingFilter))
  }

  const handlFilterSorting = (
    filter: ItemFilter[],
    sorting: ItemSort[],
  ) => {
    console.log(`handleFilterSorting:\nfilter:(${JSON.stringify(filter, null, 2)})\nsorting(${JSON.stringify(sorting, null, 2)})`)
    setSortedFilteredItems(sortAndFilterItems(sortedFilteredItems.rawItems, sortedFilteredItems.rawFilterableItems, { filter, sorting }))
    focusedElementIdRef.current = null
  };

  const focusInDashboard = async (elementId: string) => {
    const index = toCardIndex(elementId, page, sortedFilteredItems.filteredItems)
    if (index == null) return
    const element = await awaitElementById(toCardElementId(index))

    if (element) {
      element.scrollIntoView();
      element.focus();
    }
    setInfoDisplay(index)
  };

  const onFocus = (index: number) => {
    focusedElementIdRef.current = toCardElementId(index)
    onMouseOver(index)
  }
  const onMouseOver = (index: number) => {
    setInfoDisplay(index)
  }
  const onMouseOverElement = (elementId: string) => {
    const index = toCardIndex(elementId, page, sortedFilteredItems.filteredItems)
    if (index == null) return
    onMouseOver(index)
  }
  const onMouseOut = (index: number) => {
    if (triggerInfoDisplayRef.current) {
      if (focusedElementIdRef.current) {
        onMouseOver(fromCardElementId(focusedElementIdRef.current))
        return
      }
    }
    clearInfoDisplay()
  }
  const onMouseOutElement = (elementId: string) => {
    const index = toCardIndex(elementId, page, sortedFilteredItems.filteredItems)
    if (index === null) return
    onMouseOut(index)
  }

  const getDivStyle = (index: number) => {
    const displayType = index < sortedFilteredItems.filteredItems.length ? 'block' : 'none';
    const result =
      focusedElementIdRef.current === toCardElementId(index)
        ? {
          ...(cardStyle ?? {}),
          backgroundColor: 'yellow',
          transition: 'background-color 0.5s ease-in-out',
          display: displayType,
        }
        : {
          ...(cardStyle ?? {}),
          display: displayType,

        };
    return result;
  };
  const layoutItems = (layout: DashboardLayout, itemIndices: number[]): JSX.Element => {
    return (
      <div
        id={CardShellContainerId}
        className={`${layout}-scroll-container`}
      >
        {itemIndices.map(index => (
          <CardShell
            id={toCardElementId(index)}
            index={index}
            onFocus={onFocus}
            getStyle={getDivStyle}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            className={`${layout}-scroll-content`}
          />
        ))}
      </div>
    )
  }

  const render = () => {
    return (
      <Dialog
        appendTo={'self'}
        showHeader={true}
        closable={closeable}
        showCloseIcon={closeable}
        position={'center'}
        visible={state.visible}
        onHide={() => {
          setState({ ...state, visible: false })
          if (onClose) onClose()
        }}
        style={{ width: '90vw', height: '90vh', ...(style ?? {}) }}
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
                <td colSpan={1000} className="text-center">
                  <h2>{title}</h2>
                </td>
              </tr>
              <tr style={{ alignItems: 'center', verticalAlign: 'top' }}>
                <td>
                  <Picklist
                    persistence={persistence.current}
                    pageTypes={pageTypes}
                    usingPage={page}
                    items={sortedFilteredItems.filteredItems}
                    onFocusInDashboard={focusInDashboard}
                    onMouseOver={onMouseOverElement}
                    onMouseOut={onMouseOutElement}
                  />
                  {
                    addedHeaderComponents && addedHeaderComponents
                      .filter(({ after }) => after === 'picklist')
                      .map(addedHeaderComponent => (<div style={{ float: 'left' }}>{addedHeaderComponent.element}</div>))
                  }
                </td><td style={{ width: '200px' }} rowSpan={infoDisplayRowSpan}>
                  <InfoDisplay
                    registerDisplayTrigger={triggerInfoDisplay => { triggerInfoDisplayRef.current = triggerInfoDisplay }}
                    textPaddingLeft={infoDisplayTextPaddingLeft}
                    titlePaddingLeft={infoDisplayTitlePaddingLeft}
                  />
                  {
                    addedHeaderComponents && addedHeaderComponents
                      .filter(({ after }) => after === 'infodisplay')
                      .map(addedHeaderComponent => (<div>{addedHeaderComponent.element}</div>))
                  }
                </td><td>
                  <FilterSort
                    persistence={persistence.current}
                    getFilterableItems={() => sortedFilteredItems.rawFilterableItems}
                    sortingFields={sortingFields}
                    initialFilterSort={sortedFilteredItems.sortingFilter}
                    onChange={handlFilterSorting}
                  />
                  {
                    addedHeaderComponents && addedHeaderComponents
                      .filter(({ after }) => after === 'filtersort')
                      .map(addedHeaderComponent => (<div style={{ float: 'right' }}>{addedHeaderComponent.element}</div>))
                  }
                </td>
              </tr>
              {
                addedHeaderComponents && addedHeaderComponents
                  .filter(({ after }) => 'lastrow' === after)
                  .map((addedHeaderComponent) => (
                    <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                      <td colSpan={3}>
                        {addedHeaderComponent.element}
                      </td>
                    </tr>
                  ))
              }
            </tbody></table>
        }
        className='p-dialog-maximized'
      >
        {layoutItems(layout, sortedFilteredItems.filteredItems.map((_item, index) => index))}
      </Dialog>
    );
  };
  return render();
};

export default Dashboard;
