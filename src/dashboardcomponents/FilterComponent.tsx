import React, { useState, JSX, useEffect } from "react";
import { ItemFilter, ItemDateBetweenFilter, ItemValueExistenceFilter, FilterableItems, findIndexOfFilterField, mergeFilters } from "./datatypes";
import { Checkbox } from "primereact/checkbox";
import { PickList, PickOption } from "../common/ui/picklist"
import { Calendar } from "primereact/calendar";
import { toDate } from "../common/datetime";
import "../common/ui/styles.scss";

interface FilterComponentProps {
  getFilterableItems: () => FilterableItems;
  initialFilter: ItemFilter[];
  onFilterChange: (filter: ItemFilter[]) => void;
  style?: React.CSSProperties
  trailingComponent?: JSX.Element
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  getFilterableItems,
  initialFilter,
  onFilterChange,
  style,
  trailingComponent,

}) => {
  const [filter, setFilter] = useState<ItemFilter[]>(mergeFilters(initialFilter, Object.values(getFilterableItems())));
  const [valueExistenceFilters, setValueExistenceFilters] = useState<{itemFilter: ItemValueExistenceFilter, index: number}[]>([])
  const [dateBetweenFilters, setDateBetweenFilters] = useState<{itemFilter: ItemDateBetweenFilter, index: number}[]>([])

  useEffect(() => {
    
    setValueExistenceFilters(filter.map((itemFilter, index) => {
      if (itemFilter.type === 'ValueExistence') return { itemFilter, index }
      return null
    }).filter(v => v !== null))

    setDateBetweenFilters(filter.map((itemFilter, index) => {
      if (itemFilter.type === 'DateBetween') return { itemFilter, index }
      return null
    }).filter(v => v !== null))

  },[filter])

  const handleDateBetweenFilterChange = (fieldName: string, beginDate: number, endDate: number) => {
    const newFilter = mergeFilters(filter, Object.values(getFilterableItems()))
    const fieldIndex = findIndexOfFilterField(fieldName, newFilter)
    newFilter[fieldIndex].filter.beginDate = beginDate
    newFilter[fieldIndex].filter.endDate = endDate
    setFilter(newFilter);
    onFilterChange(newFilter);
  };
  const handleValueExistenceFilterChange = (fieldName: string, value: string, checked: boolean) => {
    const newFilter = mergeFilters(filter, Object.values(getFilterableItems()))
    const fieldIndex = findIndexOfFilterField(fieldName, newFilter)
    newFilter[fieldIndex].filter[value] = checked
    setFilter(newFilter);
    onFilterChange(newFilter);
  };
  const handleValueExistenceFilterChanges = (fieldName: string, checkedValues: string[]) => {
    const newFilter = mergeFilters(filter, Object.values(getFilterableItems()))
    const fieldIndex = findIndexOfFilterField(fieldName, newFilter)

    Object.keys(newFilter[fieldIndex].filter).forEach(key => {
      newFilter[fieldIndex].filter[key] = checkedValues.includes(key)
    })
    setFilter(newFilter);
    onFilterChange(newFilter)
  }

  const renderValueExistenceFilters = (
    endComponent: JSX.Element | null
  ) => {
    if (0 === valueExistenceFilters.length) return null
    
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
            {valueExistenceFilters.map(({ itemFilter, index }, position) => {
              const valueCheckedArray = Object.entries(itemFilter.filter)
              if (valueCheckedArray.length <= 5) {
                return (
                  <td>
                    <div style={{ display: "flex" }}>
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
                      {endComponent && (position+1) == valueExistenceFilters.length && <div style={{ display: 'flex', float: 'right'}}>&nbsp;&nbsp;{endComponent}</div>}
                    </div>
                  </td>
                )
              }
              const options: PickOption<string>[] = valueCheckedArray.map(([name]) => ({label: name, value: name}))
              const selectedOptions: PickOption<string>[] = valueCheckedArray.filter(([_name, checked]) => checked).map(([name]) => ({label: name, value: name}))
              return (
                <td>
                  <div style={{ display: "flex" }}>
                    <PickList
                      multiple
                      options={options}
                      value={selectedOptions}
                      onChange={(selectedValues: string[]) => handleValueExistenceFilterChanges(itemFilter.field, selectedValues)}
                      placeholder={`Filter by Selected ${itemFilter.field}`}
                      selectedDisplayMax={5}
                      maxWidthPx={770}
                    />
                    {endComponent && (position+1) == valueExistenceFilters.length && <div style={{ display: 'flex', float: 'right'}}>&nbsp;&nbsp;{endComponent}</div>}
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
    endComponent: JSX.Element | null
  ) => {
    if (0 === dateBetweenFilters.length) return null
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
                {dateBetweenFilters.map(({ itemFilter, index }, position) => {
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

    const filterBody = [
      renderValueExistenceFilters(trailingComponent ?? null),
      renderDateBetweenFilters(trailingComponent ?? null)
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
