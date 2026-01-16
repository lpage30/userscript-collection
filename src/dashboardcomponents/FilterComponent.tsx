import React, { JSX } from 'react';
import { IUseStateMap, useStateMap } from '../common/ui/useStateMap';
import {
  ItemFilter,
  ItemDateBetweenFilter,
  ItemValueExistenceFilter,
  ItemValueRangeFilter,
  FilterableItems,
  mergeFilters,
  isExistenceFilter, isDateBetweenFilter, isRangeFilter
} from './datatypes';
import { Checkbox } from 'primereact/checkbox';
import { PickList, PickOption } from '../common/ui/picklist'
import { Calendar } from 'primereact/calendar';
import { toDate } from '../common/datetime';
import { NumberSpinner } from '../common/ui/NumberSpinner';
import '../common/ui/styles.scss';

interface FilterComponentProps {
  getFilterableItems: () => FilterableItems;
  initialFilter: ItemFilter[];
  registerGetFilter: (getFilter: () => ItemFilter[]) => void;
  style?: React.CSSProperties
  trailingComponent?: JSX.Element
}
interface TypedFilters {
  ValueExistence: { itemFilter: ItemValueExistenceFilter, index: number }[],
  DateBetween: { itemFilter: ItemDateBetweenFilter, index: number }[],
  ValueRange: { itemFilter: ItemValueRangeFilter, index: number }[],
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  getFilterableItems,
  initialFilter,
  registerGetFilter,
  style,
  trailingComponent,

}) => {
  const filterStateMap: IUseStateMap<ItemFilter> = useStateMap(mergeFilters(initialFilter, Object.values(getFilterableItems()))
    .reduce((result, item) => ({
      ...result,
      [item.field]: item
    }), {})
  )

  if (registerGetFilter) registerGetFilter(() => Object.values(filterStateMap).map(state => state.get))

  const handleDateBetweenFilterChange = (fieldName: string, beginDate: number, endDate: number) => {
    const dateBetweenFilter: ItemDateBetweenFilter = { ...(filterStateMap[fieldName].get as ItemDateBetweenFilter) }
    dateBetweenFilter.filter.beginDate = beginDate;
    dateBetweenFilter.filter.endDate = endDate;
    filterStateMap[fieldName].set(dateBetweenFilter)
  };
  const handleValueMinRangeFilterChange = (fieldName: string, minValue: number) => {
    const valueRangeFilter: ItemValueRangeFilter = { ...(filterStateMap[fieldName].get as ItemValueRangeFilter) }
    valueRangeFilter.filter.minValue = minValue;
    filterStateMap[fieldName].set(valueRangeFilter)
  };
  const handleValueMaxRangeFilterChange = (fieldName: string, maxValue: number) => {
    const valueRangeFilter: ItemValueRangeFilter = { ...(filterStateMap[fieldName].get as ItemValueRangeFilter) }
    valueRangeFilter.filter.maxValue = maxValue;
    filterStateMap[fieldName].set(valueRangeFilter)
  };
  const handleValueExistenceFilterChange = (fieldName: string, value: string, checked: boolean) => {
    const valueExistenceFilter: ItemValueExistenceFilter = { ...(filterStateMap[fieldName].get as ItemValueExistenceFilter) }
    valueExistenceFilter.filter[value] = checked;
    filterStateMap[fieldName].set(valueExistenceFilter)
  };
  const handleValueExistenceFilterChanges = (fieldName: string, checkedValues: string[]) => {
    const valueExistenceFilter: ItemValueExistenceFilter = { ...(filterStateMap[fieldName].get as ItemValueExistenceFilter) }
    Object.keys(valueExistenceFilter.filter).forEach(key => {
      valueExistenceFilter.filter[key] = checkedValues.includes(key)
    })
    filterStateMap[fieldName].set(valueExistenceFilter)
  }

  const renderValueExistenceFilters = (
    valueExistencefilters: { itemFilter: ItemValueExistenceFilter, index: number }[],
    endComponent: JSX.Element | null
  ) => {
    if (0 === valueExistencefilters.length) return null

    return (
      <table
        style={{
          tableLayout: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '0',
          marginBottom: 'auto',
          width: '100%',
          ...(style ?? {}),
        }}
      ><tbody>
          <tr style={{ alignItems: 'center', verticalAlign: 'top' }}>
            {valueExistencefilters.map(({ itemFilter, index }, position) => {
              const valueCheckedArray = Object.entries(itemFilter.filter)
              if (valueCheckedArray.length <= 5) {
                return (
                  <td>
                    <div style={{ display: 'flex' }}>
                      {valueCheckedArray.map(([value, checked], index2) => (
                        <>
                          {0 < index2 && <>&nbsp;&nbsp;</>}
                          <Checkbox
                            inputId={`${index}-${index2}-f`}
                            variant='filled'
                            onChange={(e) => handleValueExistenceFilterChange(itemFilter.field, value, e.checked)}
                            checked={checked}
                            className='p-checkbox-sm'
                            style={{ marginTop: '2px' }}
                          ></Checkbox>
                          &nbsp;
                          <label
                            htmlFor={`${index}-${index2}-f`}
                            className='text-sm'
                          >{`${itemFilter.field}: ${value}`}</label>
                        </>
                      ))}
                      {endComponent && (position + 1) == valueExistencefilters.length && <div style={{ display: 'flex', float: 'right' }}>&nbsp;&nbsp;{endComponent}</div>}
                    </div>
                  </td>
                )
              }
              const options: PickOption<string>[] = valueCheckedArray.map(([name]) => ({ label: name, value: name }))
              const selectedOptions: PickOption<string>[] = valueCheckedArray.filter(([_name, checked]) => checked).map(([name]) => ({ label: name, value: name }))
              return (
                <td>
                  <div style={{ display: 'flex' }}>
                    <PickList
                      multiple
                      options={options}
                      value={selectedOptions}
                      onChange={(selectedValues: string[]) => handleValueExistenceFilterChanges(itemFilter.field, selectedValues)}
                      placeholder={`Filter by Selected ${itemFilter.field}`}
                      selectedDisplayMax={5}
                      maxWidthPx={770}
                    />
                    {endComponent && (position + 1) == valueExistencefilters.length && <div style={{ display: 'flex', float: 'right' }}>&nbsp;&nbsp;{endComponent}</div>}
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
    dateBetweenFilters: { itemFilter: ItemDateBetweenFilter, index: number }[],
    endComponent: JSX.Element | null
  ) => {
    if (0 === dateBetweenFilters.length) return null
    return (
      <table
        style={{
          tableLayout: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '0',
          marginBottom: 'auto',
          width: '100%',
          ...(style ?? {}),
        }}
      ><tbody>
          <tr style={{ alignItems: 'center', verticalAlign: 'top' }}>
            <td>
              <div style={{ display: 'flex', padding: '2px' }}>
                {dateBetweenFilters.map(({ itemFilter, index }, position) => {
                  return (
                    <>
                      {0 < position && <>&nbsp;&nbsp;</>}
                      <label
                        htmlFor={`${index}-f`}
                        className='text-sm'
                        style={{ marginTop: '10px' }}
                      >{`${itemFilter.field}`}</label>
                      &nbsp;
                      <Calendar
                        id={`${index}-f`}
                        selectionMode='range'
                        value={[toDate(itemFilter.filter.beginDate), toDate(itemFilter.filter.endDate)]}
                        onChange={(e) => handleDateBetweenFilterChange(itemFilter.field, e.value[0].getTime(), e.value[1].getTime())}
                        showTime hourFormat='24'
                        style={{ width: '100%', padding: 0 }}
                        inputStyle={{ padding: 0 }}
                      />
                    </>
                  )
                }).flat().filter(e => e !== null)
                }
                {endComponent && <div style={{ display: 'flex', float: 'right' }}>&nbsp;&nbsp;{endComponent}</div>}
              </div>
            </td>
          </tr>
        </tbody></table>
    )
  }
  const renderValueRangeFilters = (
    valueRangeFilter: { itemFilter: ItemValueRangeFilter, index: number }[],
    endComponent: JSX.Element | null
  ) => {
    console.log(`Rendering renderValueRangeFilters`)
    if (0 === valueRangeFilter.length) return null
    return (
      <table
        style={{
          tableLayout: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '0',
          marginBottom: 'auto',
          width: '100%',
          ...(style ?? {}),
        }}
      ><tbody>
          <tr style={{ alignItems: 'center', verticalAlign: 'top' }}>
            <td>
              <table
                style={{
                  tableLayout: 'auto',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginTop: '0',
                  marginBottom: 'auto',
                  width: '100%'
                }}
              >
                <thead>
                  <tr><th style={{ textAlign: 'right'}}>FieldName</th><th>MinValue</th><th>MaxValue</th></tr>
                </thead>
                <tbody>
                  {valueRangeFilter.map(({ itemFilter, index }, position) => {
                    console.log(`Rendering: ${itemFilter.field} with ${JSON.stringify(itemFilter.filter, null, 2)}`)
                    return (
                      <tr>
                        <td style={{ textAlign: 'right'}}>{itemFilter.field}</td>
                        <td>
                          <NumberSpinner
                            minValue={{min: 0, max: itemFilter.filter.maxValue, value: itemFilter.filter.minValue, onChange: (value: number) => handleValueMinRangeFilterChange(itemFilter.field, value)}}
                            prefix={itemFilter.displayData.prefix}
                            suffix={itemFilter.displayData.suffix}
                            step={itemFilter.displayData.step}
                            valueDisplayFormat={itemFilter.displayData.formatValue}
                            buttonLayout={'horizontal'}
                            containerStyle={{ justifyContent: 'right' }}
                          />
                        </td>
                        <td>
                          <NumberSpinner
                            maxValue={{min: itemFilter.filter.minValue , value: itemFilter.filter.maxValue, onChange: (value: number) => handleValueMaxRangeFilterChange(itemFilter.field, value)}}
                            prefix={itemFilter.displayData.prefix}
                            suffix={itemFilter.displayData.suffix}
                            step={itemFilter.displayData.step}
                            valueDisplayFormat={itemFilter.displayData.formatValue}
                            buttonLayout={'horizontal'}
                            containerStyle={{ justifyContent: 'right' }}
                          />
                        </td>
                      </tr>
                    )
                  })}</tbody>
              </table>
              {endComponent && <div style={{ display: 'flex', float: 'right' }}>&nbsp;&nbsp;{endComponent}</div>}
            </td>
          </tr>
        </tbody></table>
    )
  }
  const render = () => {
    const typedFilters: TypedFilters = Object.values(filterStateMap)
      .reduce((typeFilterArrayMap: TypedFilters, itemFilter, index) => {
        const filter = itemFilter.get
        if (isExistenceFilter(filter)) {
          typeFilterArrayMap.ValueExistence.push({ itemFilter: filter, index })
        }
        if (isDateBetweenFilter(filter)) {
          typeFilterArrayMap.DateBetween.push({ itemFilter: filter, index })
        }
        if (isRangeFilter(filter)) {
          typeFilterArrayMap.ValueRange.push({ itemFilter: filter, index })
        }
        return typeFilterArrayMap
      }, {
        ValueExistence: [],
        DateBetween: [],
        ValueRange: [],
      } as TypedFilters)

    const filterBody = [
      renderValueExistenceFilters(typedFilters.ValueExistence, trailingComponent ?? null),
      renderDateBetweenFilters(typedFilters.DateBetween, trailingComponent ?? null),
      renderValueRangeFilters(typedFilters.ValueRange, trailingComponent ?? null)
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
