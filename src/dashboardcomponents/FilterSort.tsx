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
  onChange,
}) => {
  const [filter, setFilter] = useState<ItemFilter[]>(
    initialFilterSort.filter,
  );
  const [sorting, setSorting] = useState<ItemSort[]>(
    initialFilterSort.sorting,
  );

  const applyChange = () => {
    persistence.storeFilter(filter);
    persistence.storeSorting(sorting);
    onChange(filter, sorting);
  };
  const clearFilterAndSort = () => {
    persistence.deleteFilter();
    persistence.deleteSorting();
    setFilter(persistence.loadFilter())
    setSorting(persistence.loadSorting())
    onChange(filter, sorting);
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
          initialFilter={filter}
          onFilterChange={setFilter}
        />
        </td></tr>
        <tr><td>
        <SortComponent
          sortFields={sortingFields}
          initialSorting={sorting}
          onSortChange={setSorting}
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
