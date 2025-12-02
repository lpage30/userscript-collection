import React, { useState } from "react";
import { Button } from "primereact/button";
import "../common/ui/styles.css";
import { FilterableItems, ItemFilter, ItemSort, SortingFilter } from "./datatypes";
import { PersistenceClass } from "./persistence";
import FilterComponent from "./FilterComponent";
import SortComponent from "./SortComponent";

interface FilterSortProps {
  persistence: PersistenceClass
  filterableItems: FilterableItems;
  sortingFields: string[];
  initialFilterSort: SortingFilter;
  onChange: (filter: ItemFilter[], sorting: ItemSort[]) => void;
}

const FilterSort: React.FC<FilterSortProps> = ({
  persistence,
  initialFilterSort,
  filterableItems,
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
  const render = () => {
    return (
        <div>
          <FilterComponent
            filterableItems={filterableItems}
            initialFilter={filter}
            onFilterChange={setFilter}
          />
          <SortComponent
            sortFields={sortingFields}
            initialSorting={sorting}
            onSortChange={setSorting}
            style={{marginTop: '3px'}}
            trailingComponent={
              <Button 
                className="app-button"
                onClick={applyChange}
              >Apply Filter & Sort</Button>
            }
          />
          
      </div>
    );
  };
  return render();
};

export default FilterSort;
