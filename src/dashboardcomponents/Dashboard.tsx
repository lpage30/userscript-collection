import React, { useState, useEffect, useRef, CSSProperties, JSX, BaseSyntheticEvent } from 'react';
import '../common/ui/styles.scss';
import { Dialog } from 'primereact/dialog';
import { awaitElementById } from '../common/await_functions';
import {
  Card,
  FilterableItems,
  InfoDisplayItem,
  toCardElementId, fromCardElementId, toCardIndex,
  SortedFilteredItems, sortAndFilterItems,
  ItemSort, ItemFilter, CardShellContainerId
} from './datatypes';
import { PersistenceClass } from './persistence';
import Picklist from './PickList';
import InfoDisplay from './InfoDisplay';
import FilterSort from './FilterSort';
import CardShell from './CardShell';

export type DashboardLayout = 'vertical' | 'horizontal' | 'grid' | 'grid-2' | 'grid-3' | 'grid-4'
interface DashboardProps {
  title: string
  getPersistence: () => PersistenceClass
  pageTypes: string[]
  getFilterableItems: () => FilterableItems;
  sortingFields: string[];
  page: string
  getCards: () => Card[];
  style?: CSSProperties
  cardStyle?: CSSProperties
  ignoreClickEvent?: (e: BaseSyntheticEvent) => boolean
  layout?: DashboardLayout
  registerRefreshContent?: (refreshContent: () => void) => void
  registerRefreshFunction?: (refreshFunction: (showDialog: boolean) => void) => void
  onClose?: () => void
  addedHeaderComponent?: {
    after: 'picklist' | 'infodisplay' | 'filtersort' | 'lastrow',
    element: JSX.Element,
  }
}

const Dashboard: React.FC<DashboardProps> = ({
  title,
  getPersistence,
  pageTypes,
  getFilterableItems,
  sortingFields,
  page,
  getCards,
  style,
  cardStyle,
  ignoreClickEvent,
  layout = 'grid',
  registerRefreshContent,
  registerRefreshFunction,
  onClose,
  addedHeaderComponent

}) => {
  const persistence = useRef<PersistenceClass>(getPersistence())

  const triggerInfoDisplayRef = useRef<(displayItem: InfoDisplayItem | null) => void>(null)
  const [visible, setVisible] = useState(true);
  const [sortedFilteredItems, setSortedFilteredItems] = useState<
    SortedFilteredItems<Card>
  >(
    sortAndFilterItems(getCards(), getFilterableItems(), {
      filter: Object.entries(getFilterableItems()).map(([field, itemFilter]) => persistence.current.loadFilter().find(loaded => loaded.field === field) ?? itemFilter),
      sorting: persistence.current.loadSorting()
    }),
  );
  const focusedElementIdRef = useRef<string>(null)
  if (registerRefreshContent) registerRefreshContent(() => refreshContent())
  if (registerRefreshFunction) registerRefreshFunction((showDialog: boolean) => {
    refreshContent()
    setVisible(showDialog)
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
      if (undefined === item.renderable) {
        console.error(`Card[${index}]: Missing renderable. "${item.displayLines().join('|')}"`)
        return
      }
      const cardParent = document.getElementById(toCardElementId(index));
      cardParent.appendChild(item.renderable)
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
    }),

      setSortedFilteredItems(
        sortAndFilterItems(getCards(), filterableItems, sortedFilteredItems.sortingFilter)
      )
  }

  const handlFilterSorting = (
    filter: ItemFilter[],
    sorting: ItemSort[],
  ) => {
    setSortedFilteredItems(
      sortAndFilterItems(sortedFilteredItems.rawItems, sortedFilteredItems.rawFilterableItems, { filter, sorting }),
    );
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
  };

  const onFocus = (index: number) => {
    focusedElementIdRef.current = toCardElementId(index)
    onMouseOver(index)
  }
  const onMouseOver = (index: number) => {
    if (triggerInfoDisplayRef.current) {
      let item: Card | null = null
      if (index < sortedFilteredItems.filteredItems.length) {
        item = sortedFilteredItems.filteredItems[index]
      }
      triggerInfoDisplayRef.current(item)
    }
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
      triggerInfoDisplayRef.current(null)
    }
  }
  const onMouseOutElement = (elementId: string) => {
    const index = toCardIndex(elementId, page, sortedFilteredItems.filteredItems)
    if (index == null) return
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
            ignoreClickEvent={ignoreClickEvent}
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
        closable={[undefined, null].includes(onClose)}
        position={'center'}
        visible={visible}
        onHide={() => {
          setVisible(false)
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
                  {addedHeaderComponent && addedHeaderComponent.after === 'picklist' && <div style={{ float: 'left' }}>
                    {addedHeaderComponent.element}
                  </div>}
                </td><td style={{ width: '200px' }}>
                  <InfoDisplay registerDisplayTrigger={triggerInfoDisplay => { triggerInfoDisplayRef.current = triggerInfoDisplay }} />
                  {addedHeaderComponent && addedHeaderComponent.after === 'infodisplay' && <div>
                    {addedHeaderComponent.element}
                  </div>}
                </td><td>
                  <FilterSort
                    persistence={persistence.current}
                    getFilterableItems={() => sortedFilteredItems.rawFilterableItems}
                    sortingFields={sortingFields}
                    initialFilterSort={sortedFilteredItems.sortingFilter}
                    onChange={handlFilterSorting}
                  />
                  {addedHeaderComponent && addedHeaderComponent.after === 'filtersort' && <div style={{ float: 'right' }}>
                    {addedHeaderComponent.element}
                  </div>}
                </td>
              </tr>
              {addedHeaderComponent && addedHeaderComponent.after === 'lastrow' &&
                <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                  <td colSpan={3}>
                    {addedHeaderComponent.element}
                  </td>
                </tr>
              }

            </tbody></table>
        }
        className='p-dialog-maximized'
      >
        {layoutItems(layout, sortedFilteredItems.sortedItems.map((_item, index) => index))}
      </Dialog>
    );
  };
  return render();
};

export default Dashboard;
