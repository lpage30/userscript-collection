import React, { useState, JSX } from "react";
import { ItemFilter, ItemDateBetweenFilter, ItemValueExistenceFilter, FilterableItems } from "./datatypes";
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
  trailingComponent?: JSX.Element

}

const FilterComponent: React.FC<FilterComponentProps> = ({
  filterableItems,
  initialFilter,
  onFilterChange,
  style,
  trailingComponent,
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
  const renderValueExistenceFilters = (
    filters: { itemFilter: ItemValueExistenceFilter, index: number}[],
    endComponent: JSX.Element | null
  ) => {
    if (0 === filters.length) return null
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
      ><tbody>
          <tr style={{ alignItems: "center", verticalAlign: "top" }}>
            {filters.map(({ itemFilter, index }, position) => {
              const valueCheckedArray = Object.entries(itemFilter.filter)
              if (valueCheckedArray.length <= 5) {
                return (
                  <td>
                    <div style={{ display: "flex", padding: '2px' }}>
                      {valueCheckedArray.map(([value, checked], index2) => (
                        <>
                          {0 < index2 && <>&nbsp;&nbsp;</>}
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
                        </>
                      ))}
                      {endComponent && (position+1) == filters.length && <div style={{ display: 'flex', float: 'right'}}>&nbsp;&nbsp;{endComponent}</div>}
                    </div>
                  </td>
                )
              }
              const maxValueLen = valueCheckedArray.reduce((maxTextLen, [value]) => value.length > maxTextLen ? value.length : maxTextLen, 0)
              return (
                <td>
                  <div style={{ display: "flex", padding: '2px' }}>
                    <MultiSelect
                      value={valueCheckedArray.filter(([value, checked]) => checked).map(([value]) => value)}
                      options={valueCheckedArray.map(([value]) => value)}
                      placeholder={`FilterBy Selected ${itemFilter.field}`}
                      onChange={(e) => handleValueExistenceFilterChanges(itemFilter.field, e.value)}
                      style={{ width: `${maxValueLen * 10}px` }}
                    />
                    {endComponent && (position+1) == filters.length && <div style={{ display: 'flex', float: 'right'}}>&nbsp;&nbsp;{endComponent}</div>}
                  </div>
                </td>
              )
            }).flat().filter(e => e !== null)
            }
          </tr>
        </tbody>
      </table>
    )
  }
  const renderDateBetweenFilters = (
    filters: { itemFilter: ItemDateBetweenFilter, index: number}[],
    endComponent: JSX.Element | null
  ) => {
    if (0 === filters.length) return null
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
      ><tbody>
          <tr style={{ alignItems: "center", verticalAlign: "top" }}>
            <td>
              <div style={{ display: "flex", padding: '2px' }}>
                {filters.map(({ itemFilter, index }, position) => {
                  return (
                    <>
                      {0 < position && <>&nbsp;&nbsp;</>}
                      <label
                        htmlFor={`${index}-f`}
                        className="text-sm"
                        style={{marginTop: '10px'}}
                      >{`${itemFilter.field}`}</label>
                      &nbsp;
                      <Calendar
                        id={`${index}-f`}
                        selectionMode='range'
                        value={[toDate(itemFilter.filter.beginDate), toDate(itemFilter.filter.endDate)]}
                        onChange={(e) => handleDateBetweenFilterChange(itemFilter.field, e.value[0].getTime(), e.value[1].getTime())}
                        showTime hourFormat="24"
                        style={{ width: '100%', padding: 0}}
                        inputStyle={{ padding: 0 }}
                      />
                    </>
                  )
                }).flat().filter(e => e !== null)
                }
                {endComponent && <div style={{ display: 'flex', float: 'right'}}>&nbsp;&nbsp;{endComponent}</div>}
              </div>
            </td>
          </tr>
        </tbody></table>
    )
  }
  const render = () => {
    const valueExistenceFilters = Object.values(filter).map((itemFilter, index) => {
      if (itemFilter.type === 'ValueExistence') return { itemFilter, index }
      return null
    }).filter(v => v !== null)

    const dateBetweenFilters = Object.values(filter).map((itemFilter, index) => {
      if (itemFilter.type === 'DateBetween') return { itemFilter, index }
      return null
    }).filter(v => v !== null)

    const filterBody = [
      renderValueExistenceFilters(valueExistenceFilters, 0 < dateBetweenFilters.length ?  null : trailingComponent ?? null),
      renderDateBetweenFilters(dateBetweenFilters, trailingComponent ?? null)
    ]
    return (
      <>
        {filterBody.filter(e => e !== null)}
      </>
    );
  };
  return render();
};

export default FilterComponent;
