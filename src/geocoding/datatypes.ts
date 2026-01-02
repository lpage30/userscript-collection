import { LineString, Feature, Polygon } from 'geojson'
import { Units } from '@turf/turf'

export interface GeojsonIndex {
    index: number
    lineString: Feature<LineString>
    polygon: Feature<Polygon>
}

export interface GeoCoordinate {
    lat: number
    lon: number
}
export const toGeoCoordinateString = (coordinate: GeoCoordinate): string => 
    coordinate ? `Lat: ${coordinate.lat}, Lon: ${coordinate.lon}` : 'Coordinates not disclosed'

export interface CountryCityStateBase extends GeoCoordinate {
    name: string
    isoCode: string
    geojsonIndexes: number[],
    distantGeojsonIndexes: number[],
    distantMaxMiles: number,
}

export interface City extends Omit<CountryCityStateBase, 'isoCode'> {
}

export interface State extends CountryCityStateBase {
    cities: {
        [city: string]: City
    }
}

export interface Country extends CountryCityStateBase {
    states: {
        state: State
    }
}

export type CountryStateCityMapType = {
    [country: string]: Country
}

export type CountryStateCityCodeToNameIndexType = {
    [countryCode: string]: {
        name: string
        states: {
            [stateCode: string]: {
                name: string
                cities: string[],
            }
        },
    }
}

export interface CountryStateCity {
    country: Country,
    state?: State,
    city?: City
}
export const toCityStateCountryString = (location: CountryStateCity): string => [
    (location ?? {}).city?.name,
    (location ?? {}).state?.isoCode,
    (location ?? {}).country?.isoCode
].filter(p => ![undefined, null].includes(p)).join(', ')

export interface GeoAddress {
    address?: string
    city?: string
    state?: string
    country: string
    coordinate?: GeoCoordinate
}
export interface GeoCountryStateCityAddress extends CountryStateCity {
    address?: string
    coordinate?: GeoCoordinate
}
export const toGeoCountryStateCityAddressString = (address: GeoCountryStateCityAddress): string => [
    address.address ?? 'address not disclosed',
    toCityStateCountryString(address),
    toGeoCoordinateString(address.coordinate),
].filter(p => ![undefined, null].includes(p)).join('|')

export interface GeoPlace {
    coordinate: GeoCoordinate
    region?: CountryStateCity
}
export const toGeoPlaceString = (place: GeoPlace): string => `${toGeoCoordinateString(place.coordinate)} ${toCityStateCountryString(place.region)}`
export const toGeoPlace = (address: GeoCountryStateCityAddress): GeoPlace => ({ coordinate: address.coordinate, region: { country: address.country, state: address.state, city: address.city }})

export interface Distance {
    value: number
    units: Units
}
export const toDistanceString = (distance: Distance): string => `${distance.value.toFixed(2)} ${distance.units}`

export interface Place {
    place: GeoPlace
    distance: Distance
}
export const toPlaceString = (place: Place): string => `${toDistanceString(place.distance)} ${toCityStateCountryString(place.place.region)}`
