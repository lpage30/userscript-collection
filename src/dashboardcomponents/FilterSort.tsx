import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import "../common/ui/styles.scss";
import { FilterableItems, ItemFilter, ItemSort, SortingFilter } from "./datatypes";
import { PersistenceClass } from "./persistence";
import FilterComponent from "./FilterComponent";
import SortComponent from "./SortComponent";

interface FilterSortProps {
  persistence: PersistenceClass
  getFilterableItems: () => FilterableItems;
  sortingFields: string[];
  initialFilterSort: SortingFilter;
  onChange: (filter: ItemFilter[], sorting: ItemSort[]) => void;
}

const FilterSort: React.FC<FilterSortProps> = ({
  persistence,
  initialFilterSort,
  getFilterableItems,
  sortingFields,
  onChange
}) => {
  const [sortingFilter, setSortingFilter] = useState<SortingFilter>(initialFilterSort)
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
    setSortingFilter(initialFilterSort)
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

export default FilterSort;
