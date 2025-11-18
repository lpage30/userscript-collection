import React, { useState } from "react";
import { ItemFilter, FilterableItems } from "./datatypes";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import "../common/ui/styles.css";

interface FilterComponentProps {
  filterableItems: FilterableItems;
  initialFilter: ItemFilter[];
  onFilterChange: (filter: ItemFilter[]) => void;
  style?: React.CSSProperties
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  filterableItems,
  initialFilter,
  onFilterChange,
  style
}) => {
  const [filter, setFilter] = useState<FilterableItems>(initialFilter
    .reduce((fieldFilter, filter) => ({
      ...fieldFilter,
      [filter.field]: {...filter}
    }), {} as { [field: string]: ItemFilter})
  );
  const handleFilterChange = (field: string, value: string, checked: boolean) => {
    const newFilter = {...filter}
    if (newFilter[field] === undefined) {
      newFilter[field] = {...filterableItems[field]}
    }
    newFilter[field].filter[value] = checked
    setFilter(newFilter);
    onFilterChange(Object.values(newFilter));
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
            {Object.values(filterableItems).map(
              (itemFilter, index) => {
                const valueCheckedArray = Object.entries(itemFilter.filter)
                if (valueCheckedArray.length <= 5) {
                  return valueCheckedArray.map(([value, checked], index2) => (
                    <td>
                      <div style={{ display: "flex", padding: "5px" }}>
                        <Checkbox
                          inputId={`${index}-${index2}-f`}
                          variant="filled"
                          onChange={(e) => handleFilterChange(itemFilter.field, value, e.checked)}
                          checked={checked}
                          className="p-checkbox-sm"
                          style={{ marginTop: "2px" }}
                        ></Checkbox>
                        &nbsp;
                        <label
                          htmlFor={`${index}-${index2}-f`}
                          className="text-sm"
                        >{`${itemFilter.field}: ${value}`}</label>
                      </div>
                    </td>
                  ))
                }
                const maxValueLen = valueCheckedArray.reduce((maxTextLen, [value]) => value.length > maxTextLen ? value.length : maxTextLen, 0)
                return (<td>
                    <MultiSelect 
                      value={valueCheckedArray.filter(([value, checked]) => checked).map(([value]) => value)}
                      options={valueCheckedArray.map(([value]) => value)}
                      placeholder={`FilterBy Selected ${itemFilter.field}`}
                      onChange={(e) => {
                        valueCheckedArray.map(([value]) => value).forEach(value => {
                          handleFilterChange(itemFilter.field, value, e.value.includes(value))
                        })
                      }}
                      style={{ width: `${maxValueLen * 10}px`}}
                    />
                </td>)

              }
            ).flat()}
          </tr>
        </tbody>
      </table>
    );
  };
  return render();
};

export default FilterComponent;
