import React, { useState } from "react";
import { ItemFilter, FilterableItems } from "./datatypes";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { toDate } from "../common/datetime";
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
      [filter.field]: { ...filter }
    }), {} as { [field: string]: ItemFilter })
  );
  const handleDateBetweenFilterChange = (field: string, beginDate: number, endDate: number) => {
    const newFilter = { ...filter }
    if (newFilter[field] === undefined) {
      newFilter[field] = { ...filterableItems[field] }
    }
    newFilter[field].filter.beginDate = beginDate
    newFilter[field].filter.endDate = endDate
    setFilter(newFilter);
    onFilterChange(Object.values(newFilter));
  };
  const handleValueExistenceFilterChange = (field: string, value: string, checked: boolean) => {
    const newFilter = { ...filter }
    if (newFilter[field] === undefined) {
      newFilter[field] = { ...filterableItems[field] }
    }
    newFilter[field].filter[value] = checked
    setFilter(newFilter);
    onFilterChange(Object.values(newFilter));
  };
  const handleValueExistenceFilterChanges = (field: string, checkedValues: string[]) => {
    const newItemFilter: ItemFilter = {
      field,
      type: 'ValueExistence',
      filter: Object.entries(filterableItems[field].filter).reduce((newFilter, [value]) => ({
        ...newFilter,
        [value]: checkedValues.includes(value)
      }), {})
    }
    const newFilter = { ...filter }
    newFilter[field] = newItemFilter
    setFilter(newFilter);
    onFilterChange(Object.values(newFilter));

  }

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
            {
              Object.values(filter).map(
                (itemFilter, index) => {
                  if (itemFilter.type !== 'ValueExistence') {
                    return null
                  }
                  const valueCheckedArray = Object.entries(itemFilter.filter)
                  if (valueCheckedArray.length <= 5) {
                    return valueCheckedArray.map(([value, checked], index2) => (
                      <td>
                        <div style={{ display: "flex", padding: "5px" }}>
                          <Checkbox
                            inputId={`${index}-${index2}-f`}
                            variant="filled"
                            onChange={(e) => handleValueExistenceFilterChange(itemFilter.field, value, e.checked)}
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
                      onChange={(e) => handleValueExistenceFilterChanges(itemFilter.field, e.value)}
                      style={{ width: `${maxValueLen * 10}px` }}
                    />
                  </td>)
                }
              ).flat().filter(e => e !== null)
            }
            {
              Object.values(filter).map(
                (itemFilter, index) => {
                  if (itemFilter.type !== 'DateBetween') {
                    return null
                  }
                  return (
                    <td>
                      <div style={{ display: "flex", padding: "5px" }}>
                        <label
                          htmlFor={`${index}-f`}
                          className="text-sm"
                        >{`${itemFilter.field}`}</label>
                        &nbsp;
                        <Calendar
                          id={`${index}-f`}
                          selectionMode='range'
                          value={[toDate(itemFilter.filter.beginDate), toDate(itemFilter.filter.endDate)]}
                          onChange={(e) => handleDateBetweenFilterChange(itemFilter.field, e.value[0].getTime(), e.value[1].getTime())}
                          showTime hourFormat="24"
                        />
                      </div>
                    </td>
                  )
              }).flat().filter(e => e !== null)
            }
          </tr>
        </tbody>
      </table>
    );
  };
  return render();
};

export default FilterComponent;
