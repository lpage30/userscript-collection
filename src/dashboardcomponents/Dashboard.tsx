import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import '../common/ui/styles.css';
import { Dialog } from 'primereact/dialog';
import { awaitElementById } from '../common/await_functions';
import { 
  Card,
  FilterableItems,
  InfoDisplayItem,
  toCardElementId, fromCardElementId, toCardIndex, 
  SortedFilteredItems, sortAndFilterItems, 
  ItemSort, ItemFilter
} from './datatypes';
import { PersistenceClass } from './persistence';
import Picklist from './PickList';
import InfoDisplay from './InfoDisplay';
import FilterSort from './FilterSort';
import CardShell from './CardShell';


interface DashboardProps {
  title: string
  persistence: PersistenceClass
  pageTypes: string[]
  filterableItems: FilterableItems;
  sortingFields: string[];
  page: string
  cards: Card[];
  style?: CSSProperties
}

const Dashboard: React.FC<DashboardProps> = ({
  title,
  persistence,
  pageTypes,
  filterableItems,
  sortingFields,
  page, 
  cards,
  style
}) => {
  const triggerInfoDisplayRef = useRef<(displayItem: InfoDisplayItem | null) => void>(null)
  const [visible, setVisible] = useState(true);
  const [sortedFilteredItems, setSortedFilteredItems] = useState<
    SortedFilteredItems<Card>
  >(
    sortAndFilterItems(cards, {
      filter: persistence.loadFilter(),
      sorting: persistence.loadSorting(),
    }),
  );
  const focusedElementIdRef = useRef<string>(null)

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
      cardParent.appendChild(item.renderable)
    });
  };

  useEffect(() => {
    refreshCards();
  }, [sortedFilteredItems]);

  const handlFilterSorting = (
    filter: ItemFilter[],
    sorting: ItemSort[],
  ) => {
    setSortedFilteredItems(
      sortAndFilterItems(cards, { filter, sorting }),
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
          backgroundColor: 'yellow',
          transition: 'background-color 0.5s ease-in-out',
          display: displayType,
        }
        : {
          display: displayType,
        };
    return result;
  };


  const render = () => {
    return (
      <Dialog
        showHeader={true}
        closable={false}
        position={'center'}
        modal
        visible={visible}
        onHide={() => setVisible(false)}
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
                <td colSpan={3} className="text-center">
                  <h2>{title}</h2>
                </td>
              </tr>
              <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                <td>
                  <Picklist
                    persistence={persistence}
                    pageTypes={pageTypes}
                    usingPage={page}
                    items={sortedFilteredItems.filteredItems}
                    onFocusInDashboard={focusInDashboard}
                    onMouseOver={onMouseOverElement}
                    onMouseOut={onMouseOutElement}
                  />
                </td><td style={{ width: '200px' }}>
                  <InfoDisplay registerDisplayTrigger={triggerInfoDisplay => { triggerInfoDisplayRef.current = triggerInfoDisplay }} />
                </td><td>
                  <FilterSort
                    persistence={persistence}
                    filterableItems={filterableItems}
                    sortingFields={sortingFields}
                    initialFilterSort={sortedFilteredItems.sortingFilter}
                    onChange={handlFilterSorting}
                  />
                </td>
              </tr>
            </tbody></table>
        }
        className='p-dialog-maximized'
      >
        <div
          id='card-container'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          {sortedFilteredItems.sortedItems.map((_item, index) => (
            <CardShell
              id={toCardElementId(index)}
              index={index}
              onFocus={onFocus}
              getStyle={getDivStyle}
              onMouseOver={onMouseOver}
              onMouseOut={onMouseOut}
            />
          ))}
        </div>
      </Dialog>
    );
  };
  return render();
};

export default Dashboard;
