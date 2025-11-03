import React, { useState } from "react";
import {
  HealthLevelTypes,
  HealthLevelCountMap,
  HealthLevelFilter,
} from "./CompanyTypes";
import { Checkbox } from "primereact/checkbox";
import "../../common/ui/styles.css";

interface CompanyFilterComponentProps {
  healthLevelCountMap: HealthLevelCountMap;
  initialFilter: HealthLevelFilter;
  onFilterChange: (filter: HealthLevelFilter) => void;
  style?: React.CSSProperties
}

const CompanyFilterComponent: React.FC<CompanyFilterComponentProps> = ({
  initialFilter,
  healthLevelCountMap,
  onFilterChange,
  style
}) => {
  const [filter, setFilter] = useState<string[]>(
    Object.entries(initialFilter)
      .filter(([name, value]) => value)
      .map(([name]) => name),
  );
  const handleFilterChange = (level: string, checked: boolean) => {
    const newFilter = checked
      ? [...filter, level]
      : filter.filter((item) => item !== level);
    setFilter(newFilter);
    onFilterChange(
      HealthLevelTypes.reduce(
        (result, level) => ({
          ...result,
          [level]: newFilter.includes(level),
        }),
        {} as HealthLevelFilter,
      ),
    );
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
          ...(style ?? {}),
        }}
      >
        <tbody>
          <tr style={{ alignItems: "center", verticalAlign: "center" }}>
            {Object.entries(healthLevelCountMap).map(
              ([level, count], index) => (
                <td>
                  <div style={{ display: "flex", padding: "5px" }}>
                    <Checkbox
                      inputId={`${index}-f`}
                      variant="filled"
                      onChange={(e) => handleFilterChange(level, e.checked)}
                      checked={filter.includes(level)}
                      className="p-checkbox-sm"
                      style={{ marginTop: "2px" }}
                    ></Checkbox>
                    &nbsp;
                    <label
                      htmlFor={`${index}-f`}
                      className="text-sm"
                    >{`${level} (${count})`}</label>
                  </div>
                </td>
              ),
            )}
          </tr>
        </tbody>
      </table>
    );
  };
  return render();
};

export default CompanyFilterComponent;
