import { toString } from "../common/functions"
export interface InfoDisplayItem {
  displayLines: () => string[]
}

export interface PicklistItem {
  groupName: string
  label: () => string
  color: () => string
  href: (pageName: string) => string
  elementId: string
}

export interface Card extends InfoDisplayItem, PicklistItem {
  renderable: HTMLElement;
}

export interface Dashboard<T extends Card> {
  timestamp: number;
  cards: T[];
}

export interface ItemSort {
  field: string
  ascending: boolean
}

interface ItemFilterBase {
  field: string
  type: 'ValueExistence' | 'DateBetween' | 'ValueRange'
}

export interface ItemValueExistenceFilter extends ItemFilterBase {
  type: 'ValueExistence'
  filter: { [value: string]: boolean }
}
export interface ItemDateBetweenFilter extends ItemFilterBase {
  type: 'DateBetween'
  filter: { beginDate: number, endDate: number }
}
export interface ItemValueRangeFilter extends ItemFilterBase {
  type: 'ValueRange'
  displayData: {
    mode: 'decimal' | 'currency',
    suffix?: string,
    prefix?: string,
    maxWidth: number,
    step: number
    currency?: string
    locale?: string
    formatValue?: (value: number) => string
  }
  filter: { minValue: number, maxValue: number }
}
export type ItemFilter = ItemValueExistenceFilter | ItemDateBetweenFilter | ItemValueRangeFilter
export const isExistenceFilter = (value: ItemFilter): value is ItemValueExistenceFilter => value.type === 'ValueExistence'
export const isDateBetweenFilter = (value: ItemFilter): value is ItemDateBetweenFilter => value.type === 'DateBetween'
export const isRangeFilter = (value: ItemFilter): value is ItemValueRangeFilter => value.type === 'ValueRange'

export const sortFiltersByField = (filter: ItemFilter[]) => filter.sort((l: ItemFilter, r: ItemFilter) => l.field.localeCompare(r.field))
export const findIndexOfFilterField = (fieldName: string, filter: ItemFilter[]) => filter.findIndex(({ field }) => field === fieldName)

export const mergeFilters = (existing: ItemFilter[], updated: ItemFilter[]) => {
  const result: ItemFilter[] = []
  const e = sortFiltersByField(existing)
  const u = sortFiltersByField(updated)
  let ei = 0
  let ui = 0
  while (ei < e.length || ui < u.length) {
    if (e.length <= ei) {
      result.push(...u.slice(ui))
      break
    }
    if (u.length <= ui) {
      result.push(...e.slice(ei))
      break
    }
    const cmp = e[ei].field.localeCompare(u[ui].field)
    if (cmp < 0) {
      result.push(e[ei])
      ei++
    }
    if (0 == cmp) {
      result.push(u[ui])
      ei++
      ui++
    }
    if (0 < cmp) {
      result.push(u[ui])
      ui++
    }
  }
  return result
}

export type FilterableItems = { [field: string]: ItemFilter }

export interface SortingFilter {
  filter: ItemFilter[];
  sorting: ItemSort[];
}

export interface SortedFilteredItems<T extends Card> {
  rawItems: T[];
  rawFilterableItems: FilterableItems;
  sortingFilter: SortingFilter;
  sortedItems: T[];
  filteredItems: T[];
}
function sortDataFunction(l: any, r: any, ascending: boolean): number {
  if (typeof l === 'number' && typeof r === 'number') {
    return ascending ? l - r : r - l
  }
  const left = toString(l)
  const right = toString(r)
  return ascending ? left.localeCompare(right) : right.localeCompare(left)
}

function toSortFunction<T extends Card>(sorts: ItemSort[],): (l: T, r: T) => number {
  return (l: T, r: T): number => {
    let result = 0
    for (const sort of sorts) {
      if (0 !== result) return result
      if ([undefined, null].includes(l[sort.field]) && [undefined, null].includes(r[sort.field])) {
        continue
      }
      result = sortDataFunction(l[sort.field], r[sort.field], sort.ascending)
    }
    return result
  }
}
function inFilterFunction<T extends Card>(item: T, filter: ItemFilter[]): boolean {
  return filter.every(itemFilter => {
    const itemFieldValue = item[itemFilter.field]
    if (![undefined, null].includes(itemFieldValue)) {
      if (isExistenceFilter(itemFilter)) {
         return itemFilter.filter[itemFieldValue] === true
      }
      if (isDateBetweenFilter(itemFilter) && typeof itemFieldValue === 'number') {
        return itemFilter.filter.beginDate <= itemFieldValue && itemFieldValue <= itemFilter.filter.endDate
      }
      if (isRangeFilter(itemFilter) && typeof itemFieldValue === 'number') {
        return itemFilter.filter.minValue <= itemFieldValue && itemFieldValue <= itemFilter.filter.maxValue
      }
    }
    return true
  })
}
export const CardShellContainerId = 'card-shell-container'
const CardShellIdPrefix = 'card-shell-'
export function queryAllCardShells(): HTMLDivElement[] {
  return Array.from(document.querySelectorAll(`div[id*="${CardShellIdPrefix}"]`))
}
export const toCardElementId = (index: number) => `${CardShellIdPrefix}${index}`
export const fromCardElementId = (elementId: string): number => parseInt(elementId.split('-').slice(-1)[0])

export const toCardIndex = (elementId: string, pageName: string, items: Card[] | undefined): number | null => {
  const index = (items ?? []).findIndex(
    (item) => item.elementId === elementId,
  );
  return index < 0 ? null : index
}
export function sortAndFilterItems<T extends Card>(
  items: T[],
  filterableItems: FilterableItems,
  sortingFilter: SortingFilter,
): SortedFilteredItems<T> {
  const sortFunction = toSortFunction<T>(sortingFilter.sorting)
  const sortedItems: T[] = [...items].sort(sortFunction)
  const filteredItems: T[] = sortedItems.filter(item => inFilterFunction<T>(item, sortingFilter.filter));
  return {
    rawItems: items,
    rawFilterableItems: filterableItems,
    sortingFilter,
    sortedItems,
    filteredItems,
  };
}
