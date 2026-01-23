import { InfoDisplayProps } from "./InfoDisplay";
import { PersistenceClass } from "./persistence";
import { Card, FilterableItems, ItemFilter, ItemSort } from "./datatypes";
import { sortAndFilterCards } from "./FilterSort";

export interface PicklistFeatureProps {
    pageTypes: string[];
    usingPage: string;
}
export interface InfoDisplayFeatureProps extends Omit<InfoDisplayProps, 'registerDisplayTrigger'> {
    infoDisplayRowSpan?: number
}
export interface FilterSortFeatureProps {
    getFilterableItems: () => FilterableItems;
    sortingFields: string[];
    sortAndFilterCards: (
        cards: Card[],
        persistence: PersistenceClass,
        filterableItems: FilterableItems, filter?:
            ItemFilter[],
        sorting?: ItemSort[]
    ) => Card[]
}
export interface OptionalFeatures {
    getPersistence: () => PersistenceClass
    picklist?: PicklistFeatureProps
    infoDisplay?: InfoDisplayFeatureProps
    filterSort?: FilterSortFeatureProps

}

export function createFeatures(
    getPersistence: () => PersistenceClass,
    options?: {
        picklist?: PicklistFeatureProps,
        infoDisplay?: InfoDisplayFeatureProps
        filterSort?: {
            getFilterableItems: () => FilterableItems;
            sortingFields: string[];
        }
    }
): OptionalFeatures | undefined {
    if (undefined == options || 0 == Object.values(options).length) return undefined

    const picklist = options.picklist
        ? {
            ...options.picklist
        }
        : undefined
    const infoDisplay = options.infoDisplay
        ? {
            infoDisplayRowSpan: 1,
            ...options.infoDisplay
        }
        : undefined
    const filterSort = options.filterSort
        ? {
            ...options.filterSort,
            sortAndFilterCards
        }
        : undefined
    return {
        getPersistence,
        picklist,
        infoDisplay,
        filterSort
    }
}