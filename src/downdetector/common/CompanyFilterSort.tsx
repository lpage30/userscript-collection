import React, { useState } from "react";
import {
  HealthLevelCountMap,
  HealthLevelFilter,
  CompanySort,
  initialHealthLevelFilter,
  storeFilter,
  storeSorting,
} from "./CompanyTypes";
import { Button } from "primereact/button";
import "../../common/ui/styles.css";
import { SortingFilter } from "./CompanyTypes";
import CompanyFilterComponent from "./CompanyFilterComponent";
import CompanySortComponent from "./CompanySortComponent";

interface CompanyFilterSortProps {
  healthLevelCountMap: HealthLevelCountMap;
  initialFilterSort: SortingFilter;
  onChange: (filter: HealthLevelFilter, sorting: CompanySort[]) => void;
}

const CompanyFilterSort: React.FC<CompanyFilterSortProps> = ({
  initialFilterSort,
  healthLevelCountMap,
  onChange,
}) => {
  const [filter, setFilter] = useState<HealthLevelFilter>(
    initialFilterSort.filter,
  );
  const [sorting, setSorting] = useState<CompanySort[]>(
    initialFilterSort.sorting,
  );

  const applyChange = () => {
    storeFilter(filter);
    storeSorting(sorting);
    onChange(filter, sorting);
  };
  const render = () => {
    return (
      <div style={{ display: "flex", height: "auto" }}>
        <div>
          <CompanyFilterComponent
            initialFilter={filter}
            healthLevelCountMap={healthLevelCountMap}
            onFilterChange={setFilter}
          />
          <CompanySortComponent
            initialSorting={sorting}
            onSortChange={setSorting}
            style={{marginTop: '3px'}}
          />
        </div>
        <div>
          <Button className="app-button" onClick={applyChange}>
            Apply Filter & Sort
          </Button>
        </div>
      </div>
    );
  };
  return render();
};

export default CompanyFilterSort;
