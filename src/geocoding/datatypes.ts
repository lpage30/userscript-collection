import { LineString, Feature, Polygon } from 'geojson'
import * as turf from '@turf/turf'

export type GeodataSourceType = 'tl_2025_us_coastline' | 'ukcp18_uk_marine_coastline_hires'
export interface GeojsonIndex {
    index: number
    lineString: Feature<LineString>
    polygon: Feature<Polygon>
}

export interface GeoCoordinate {
    lat: number
    lon: number
}
export const isValidGeoCoordinate = (value: Partial<GeoCoordinate>): value is GeoCoordinate => undefined !== value && ![value.lat, value.lon].some(v => [null, undefined].includes(v))
export const toGeoPoint = (value: GeoCoordinate) => turf.point([value.lon, value.lat])
export const measureDistance = (source: GeoCoordinate, destination: GeoCoordinate, units: turf.Units = 'miles'): number  => turf.distance(toGeoPoint(source), toGeoPoint(destination), { units })
export const isInPolygon = (value: GeoCoordinate, polygon: Feature<Polygon>) => turf.booleanPointInPolygon(toGeoPoint(value), polygon)

export const toGeoCoordinateString = (coordinate: GeoCoordinate): string => 
    coordinate ? `Lat: ${coordinate.lat}, Lon: ${coordinate.lon}` : 'Coordinates not disclosed'

export const toGoogleMapsPlace = (coordinate: GeoCoordinate): string | undefined =>
    coordinate ? `https://www.google.com/maps/place/@${coordinate.lat},${coordinate.lon}` : undefined

export interface NameIsoCode extends Partial<GeoCoordinate> {
    name: string
    isoCode: string
    containedCoordinates: GeoCoordinate[]
}

export interface Geocoding {
    [geodataSource: string]: {
        geojsonIndexes: number[]
        distantGeojsonIndexes: number[]
    }
}

export interface CountryCityStateBase extends NameIsoCode {
    geocoding: Geocoding
    distantMaxMiles: number
}

export interface City extends Omit<CountryCityStateBase, 'isoCode' | 'containedCoordinates'> {
    countryName: string
    stateName: string
}
export interface State extends CountryCityStateBase {
    countryName: string
    cities: {
        [city: string]: City
    }
}
export interface Country extends CountryCityStateBase {
    states: {
        [state: string]: State
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


export interface CityName extends Omit<NameIsoCode, 'isoCode' | 'containedCoordinates'> {
    countryName: string
    stateName: string
}
export const toCityName = (city: City): CityName => ({
    name: city.name,
    countryName: city.countryName,
    stateName: city.stateName,
    lat: city.lat,
    lon: city.lon
})

export interface StateNameIsoCode extends NameIsoCode {
    countryName: string
    cities: CityName[]
}
export const toStateNameIsoCode = (state: State): StateNameIsoCode => ({
    name: state.name,
    isoCode: state.isoCode,
    countryName: state.countryName,
    lat: state.lat,
    lon: state.lon,
    containedCoordinates: state.containedCoordinates,
    cities: Object.values(state.cities).map(toCityName)
})

export interface CountryNameIsoCode extends NameIsoCode {
    states: StateNameIsoCode[]
}
export const toCountryNameIsoCode = (country: Country): CountryNameIsoCode => ({
    name: country.name,
    isoCode: country.isoCode,
    lat: country.lat,
    lon: country.lon,
    containedCoordinates: country.containedCoordinates,
    states: Object.values(country.states).map(toStateNameIsoCode)
})

export interface GeoAddress {
    address?: string
    city?: string
    state?: string,
    country: string,
    coordinate?: GeoCoordinate
}
export const toGeoAddressString = (address: GeoAddress): string => [
    address.address ?? 'address not disclosed',
    [address.city, address.state, address.country].filter(p => ![undefined, null].includes(p)).join(', '),
    toGeoCoordinateString(address.coordinate),
].filter(p => ![undefined, null].includes(p)).join('|')

export interface GeoCountryStateCityAddress extends CountryStateCity {
    address?: string
    coordinate?: GeoCoordinate
}
export const toGeoCountryStateCityAddressString = (address: GeoCountryStateCityAddress): string => [
    address.address ?? 'address not disclosed',
    toCityStateCountryString(address),
    toGeoCoordinateString(address.coordinate),
].filter(p => ![undefined, null].includes(p)).join(', ')

export interface GeoPlace {
    coordinate: GeoCoordinate
    region?: CountryStateCity
}
export const toGeoPlaceString = (place: GeoPlace): string => `${toGeoCoordinateString(place.coordinate)} ${toCityStateCountryString(place.region)}`
export const toGeoPlace = (address: GeoCountryStateCityAddress): GeoPlace => ({ coordinate: address.coordinate, region: { country: address.country, state: address.state, city: address.city }})

export interface Distance {
    value: number
    units: turf.Units
}
export const toDistanceString = (distance: Distance): string => `${distance.value.toFixed(2)} ${distance.units}`

export interface Place {
    place: GeoPlace
    distance: Distance
}
export const toPlaceString = (place: Place): string => `${toDistanceString(place.distance)} ${toCityStateCountryString(place.place.region)}`

export function toNameRegex(name: string): RegExp {
    return new RegExp(`^([,\\s]*|.*[,\\s]+)${name}([,\\s]*|[,\\s]+.*)$`,'ig')
}
export function isDataMatch<T extends NameIsoCode | StateNameIsoCode | CityName>(text: string, data: T): boolean {
    return (undefined !== data.name && toNameRegex(data.name).test(text)) || 
    (undefined !== data['isoCode'] && toNameRegex(data['isoCode']).test(text))
}
export function parseAddress(addressLine: string): { address: string, city?: string, state?: string, country?: string} {
    const address = addressLine
    const parts = address.split(',').map(t => t.trim()).filter(t => 0 < t.length)
    const city = 1 < parts.length ? parts[1] : undefined
    const state = 2 < parts.length ? parts[2].split(' ')[0] : undefined
    const country = 3 < parts.length ? parts[3] : undefined
    return {
        address,
        city,
        state,
        country
    }
}