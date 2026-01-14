import {
    GeoCoordinate,
    toGeoCoordinateString,
    toNameRegex,
    measureDistance,
    isValidGeoCoordinate,
} from './datatypes';

export interface CountryStateBase extends Partial<GeoCoordinate> {
    name: string
    isoCode: string
    containedCoordinates: GeoCoordinate[]
}
export type CityBase = Omit<CountryStateBase, 'isoCode' | 'containedCoordinates'>

export interface City extends CityBase {
    countryName: string
    stateName: string
}

export interface State<C extends City = City> extends CountryStateBase {
    countryName: string
    cities: {
        [city: string]: C
    }
}

export interface Country<C extends City = City, S extends State<C> = State<C>> extends CountryStateBase {
    states: {
        [state: string]: S
    }
}

export interface CountryStateCity<C extends City = City, S extends State<C> = State<C>> {
    country: Country<C, S>,
    state?: State<C>,
    city?: C
}

export const toCityStateCountryString = <C extends City = City, S extends State<C> = State<C>>(location: CountryStateCity<C, S>): string => [
    (location ?? {}).city?.name,
    (location ?? {}).state?.isoCode,
    (location ?? {}).country?.isoCode
].filter(p => ![undefined, null].includes(p)).join(', ')


export interface CountryStateCityAddress<C extends City = City, S extends State<C> = State<C>> extends CountryStateCity<C, S> {
    address?: string
    coordinate?: GeoCoordinate
}

export const toCountryStateCityAddressString = <C extends City = City, S extends State<C> = State<C>>(address: CountryStateCityAddress<C, S>): string => [
    address.address ?? 'address not disclosed',
    toCityStateCountryString(address),
    toGeoCoordinateString(address.coordinate),
].filter(p => ![undefined, null].includes(p)).join(', ')

export function isDataMatch<T extends CountryStateBase | CityBase>(text: string, data: T): boolean {
    return (undefined !== data.name && toNameRegex(data.name).test(text)) ||
        (undefined !== data['isoCode'] && toNameRegex(data['isoCode']).test(text))
}
export interface IndexOfClosestOne { distance: number, index: number }
export function indexOfClosestOne<T extends Partial<GeoCoordinate>>(
    source: GeoCoordinate,
    collection: T[],
    filteredIndices?: number[]
): IndexOfClosestOne | undefined {
    const result = collection
        .reduce((closest: IndexOfClosestOne, result: T, index: number) => {
            if (filteredIndices && !filteredIndices.includes(index)) {
                return closest
            }
            if (result['containedCoordinates']) {
                return result['containedCoordinates']
                    .reduce((subresult: IndexOfClosestOne, destination: GeoCoordinate) => {
                        const distance = measureDistance(source, destination)
                        return distance < subresult.distance
                            ? { distance, index }
                            : subresult
                    }, closest)
            }
            if (!isValidGeoCoordinate(result)) return closest
            const distance = measureDistance(source, result)
            return distance < closest.distance
                ? { distance, index }
                : closest
        }, { distance: Number.MAX_VALUE, index: -1 } as IndexOfClosestOne)
    return 0 <= result.index ? result : undefined
}