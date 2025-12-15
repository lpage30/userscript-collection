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
  type: 'ValueExistence' | 'DateBetween'
}

export interface ItemValueExistenceFilter extends ItemFilterBase {
  type: 'ValueExistence'
  filter: { [value: string]: boolean }
}
export interface ItemDateBetweenFilter extends ItemFilterBase {
  type: 'DateBetween'
  filter: { beginDate: number, endDate: number }
}
export type ItemFilter = ItemValueExistenceFilter | ItemDateBetweenFilter

export const sortFiltersByField = (filter: ItemFilter[]) => filter.sort((l: ItemFilter, r: ItemFilter) => l.field.localeCompare(r.field))
export const findIndexOfFilterField = (fieldName: string, filter: ItemFilter[]) => filter.findIndex(({field}) => field === fieldName)

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

function toSortFunction<T extends Card>(sorts: ItemSort[],): (l: T, r: T) => number {
  return (l: T, r: T): number => {
    let result = 0
    for (const sort of sorts) {
      if (0 !== result) return result
      if ([undefined, null].includes(l[sort.field]) && [undefined, null].includes(r[sort.field])) {
        continue
      }
      const left = toString(l[sort.field])
      const right = toString(r[sort.field])
      result = sort.ascending ? left.localeCompare(right) : right.localeCompare(left)
    }
    return result
  }
}
function inFilterFunction<T extends Card>(item: T, filter: ItemFilter[]): boolean {
  return filter.every(itemFilter => {
    if (item[itemFilter.field]) {
      if(itemFilter.type === 'ValueExistence') return itemFilter.filter[item[itemFilter.field]] === true
      return (itemFilter.filter.beginDate <= item[itemFilter.field] && item[itemFilter.field] <= itemFilter.filter.endDate)
    }
    return true
  })
}
export const toCardElementId = (index: number) => `card-shell-${index}`
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
