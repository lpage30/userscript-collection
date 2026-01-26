import { FilterableItems, ItemFilter } from '../dashboardcomponents/datatypes';
import { Persistence } from '../dashboardcomponents/persistence';
import { createFeatures, OptionalFeatures } from '../dashboardcomponents/OptionalFeatures'
import { PropertyInfo } from './propertyinfotypes';

const sortingFields = ['Price', 'DistanceToOcean'];
const getFilterableItems = (propertyInfo: PropertyInfo[]): FilterableItems => (
    {
        Price: {
            field: 'Price',
            type: 'ValueRange',
            displayData: {
                step: 50000,
                prefix: propertyInfo[0].currencySymbol,
                formatValue: (value: number) => value.toLocaleString(undefined)
            },
            filter: propertyInfo
                .map(({ Price }) => Price).sort()
                .filter(value => ![undefined, null].includes(value))
                .filter((value, index, array) => index === 0 || array[index - 1] !== value)
                .reduce((result, value) => ({
                    minValue: Math.min(value, result.minValue),
                    maxValue: Math.max(value, result.maxValue)
                }), { minValue: Number.MAX_VALUE, maxValue: 0 } as { minValue: number, maxValue: number })
        } as unknown as ItemFilter,
        DistanceToOcean: {
            field: 'DistanceToOcean',
            type: 'ValueRange',
            displayData: {
                suffix: ' mi',
                step: 0.25,
                formatValue: (value: number) => value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            },
            filter: propertyInfo
                .map(({ DistanceToOcean }) => DistanceToOcean).sort()
                .filter(value => ![undefined, null].includes(value))
                .filter((value, index, array) => index === 0 || array[index - 1] !== value)
                .reduce((result, value) => ({
                    minValue: Math.min(value, result.minValue),
                    maxValue: Math.max(value, result.maxValue)
                }), { minValue: Number.MAX_VALUE, maxValue: 0 } as { minValue: number, maxValue: number })
        } as unknown as ItemFilter,
    })

export function toRealestateDashboardFeatures(siteName: string, properties: PropertyInfo[]): OptionalFeatures | undefined {
    const filterableItems = getFilterableItems(properties)
    return createFeatures(
        () => Persistence(siteName, () => filterableItems),
        {
            picklist: {
                pageTypes: ['dashboard'],
                usingPage: 'dashboard'
            },
            infoDisplay: {
                infoDisplayRowSpan: 2,
                textPaddingLeft: { value: 0.5, type: 'rem' }
            },
            filterSort: {
                getFilterableItems: () => filterableItems,
                sortingFields
            }
        }
    )
}