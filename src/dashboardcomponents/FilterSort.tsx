import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import "../common/ui/styles.scss";
import { Card, FilterableItems, ItemFilter, ItemSort, SortingFilter, sortAndFilterItems, SortedFilteredItems } from "./datatypes";
import { PersistenceClass } from "./persistence";
import FilterComponent from "./FilterComponent";
import SortComponent from "./SortComponent";

export interface FilterSortProps {
  persistence: PersistenceClass
  getFilterableItems: () => FilterableItems;
  sortingFields: string[];
  initialCards: Card[];
  onChange: (filter: ItemFilter[], sorting: ItemSort[]) => void;
}
function createSortedFilteredCards(
  cards: Card[],
  persistence: PersistenceClass,
  filterableItems: FilterableItems,
  filter?: ItemFilter[],
  sorting?: ItemSort[]
): SortedFilteredItems<Card>
{
    return sortAndFilterItems<Card>(cards, filterableItems, {
      filter: filter ?? Object.entries(filterableItems).map(([field, itemFilter]) => persistence.loadFilter().find(loaded => loaded.field === field) ?? itemFilter),
      sorting: sorting ?? persistence.loadSorting()
    })
}
export function sortAndFilterCards(cards: Card[], persistence: PersistenceClass, filterableItems: FilterableItems, filter?: ItemFilter[], sorting?: ItemSort[]): Card[] {
  return createSortedFilteredCards(cards, persistence, filterableItems, filter, sorting).filteredItems
}
export const FilterSort: React.FC<FilterSortProps> = ({
  persistence,
  initialCards,
  getFilterableItems,
  sortingFields,
  onChange
}) => {
  const [sortingFilter, setSortingFilter] = useState<SortingFilter>(createSortedFilteredCards(initialCards, persistence, getFilterableItems()).sortingFilter)
    
  const getFilterRef = useRef<() => ItemFilter[]>(null)
  const getSortingRef = useRef<() => ItemSort[]>(null)
  const applyChange = () => {
    const filter = getFilterRef.current ? getFilterRef.current() : [];
    const sorting = getSortingRef.current ? getSortingRef.current() : [];
    persistence.storeFilter(filter);
    persistence.storeSorting(sorting);
    onChange(filter, sorting);
  };
  const clearFilterAndSort = () => {
    persistence.deleteFilter();
    persistence.deleteSorting();
    setSortingFilter(createSortedFilteredCards(initialCards, persistence, getFilterableItems()).sortingFilter)
    onChange([], []);
  };
  const render = () => {
    return (
      <table
        style={{
          tableLayout: "auto",
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: "0",
          marginBottom: "auto",
          width: "100%",
        }}
      ><tbody>
          <tr><td>
            <FilterComponent
              getFilterableItems={getFilterableItems}
              initialFilter={sortingFilter.filter}
              registerGetFilter={(getFilter: () => ItemFilter[]) => getFilterRef.current = getFilter}
            />
          </td></tr>
          <tr><td>
            <SortComponent
              sortFields={sortingFields}
              initialSorting={sortingFilter.sorting}
              registerGetSorting={(getSorting: () => ItemSort[]) => getSortingRef.current = getSorting}
              trailingComponent={
                <>
                  <Button
                    className="app-button"
                    onClick={applyChange}
                  >Apply Filter & Sort</Button>&nbsp;
                  <Button
                    className="app-button"
                    onClick={clearFilterAndSort}
                  >Reset Filter & Sort</Button>
                </>

              }
            />
          </td></tr>
        </tbody></table>
    );
  };
  return render();
};
