import { LineString, Feature, Polygon } from 'geojson'
import * as turf from '@turf/turf'

export type GeodataSourceType = 'tl_2025_us_coastline' | 'ukcp18_uk_marine_coastline_hires'

export interface GeojsonIndex {
    source: GeodataSourceType
    index: number
    lineString: Feature<LineString>
    polygon: Feature<Polygon>
}
export enum GeoCoordinateField {
    lat = 'lat',
    lon = 'lon'
}
export interface GeoCoordinate {
    [GeoCoordinateField.lat]: number
    [GeoCoordinateField.lon]: number
}

export const isValidGeoCoordinate = (value: Partial<GeoCoordinate>): value is GeoCoordinate => undefined !== value && ![value.lat, value.lon].some(v => [null, undefined].includes(v))
export const toGeoPoint = (value: GeoCoordinate) => turf.point([value.lon, value.lat])
export const measureDistance = (source: GeoCoordinate, destination: GeoCoordinate, units: turf.Units = 'miles'): number => turf.distance(toGeoPoint(source), toGeoPoint(destination), { units })
export const isInPolygon = (value: GeoCoordinate, polygon: Feature<Polygon>) => turf.booleanPointInPolygon(toGeoPoint(value), polygon)

export const toGeoCoordinateString = (coordinate: GeoCoordinate): string =>
    coordinate ? `Lat: ${coordinate.lat}, Lon: ${coordinate.lon}` : 'Coordinates not disclosed'

export const toGoogleMapsPlace = (coordinate: GeoCoordinate): string | undefined =>
    coordinate ? `https://www.google.com/maps/place/@${coordinate.lat},${coordinate.lon}` : undefined

export interface Geocoding {
    [geodataSource: string]: {
        geojsonIndexes: number[]
        distantGeojsonIndexes: number[]
    }
}
export enum GeoAddressField {
    address = 'address',
    city = 'city',
    state = 'state',
    country = 'country',
    coordinate = 'coordinate'
}
export interface GeoAddress {
    [GeoAddressField.address]?: string
    [GeoAddressField.city]?: string
    [GeoAddressField.state]?: string,
    [GeoAddressField.country]: string,
    [GeoAddressField.coordinate]?: GeoCoordinate
}
export const toGeoAddressString = (address: GeoAddress): string => [
    address.address ?? 'address not disclosed',
    [address.city, address.state, address.country].filter(p => ![undefined, null].includes(p)).join(', '),
    toGeoCoordinateString(address.coordinate),
].filter(p => ![undefined, null].includes(p)).join('|')

export interface Distance {
    value: number
    units: turf.Units
}
export const toDistanceString = (distance: Distance): string => `${distance.value.toFixed(2)} ${distance.units}`

export function toNameRegex(name: string): RegExp {
    return new RegExp(`^([,\\s]*|.*[,\\s]+)${name}([,\\s]*|[,\\s]+.*)$`, 'ig')
}
export interface FullAddress {
    street?: string
    city?: string
    state?: string
    postalcode?: string
    country?: string
}
export function joinFullAddress(address: FullAddress): string {
    const { street, city, state, postalcode, country} = address
    let result = ''
    if (street) {
        result = street
    }
    if (city) {
        result = `${result}${0 < result.length ? ', ' : ''}${city}`
    }
    if (state) {
        result = `${result}${0 < result.length ? ', ' : ''}${state}`
    }
    if (postalcode) {
        result = `${result}${0 < result.length ? (state ? ' ' : ', ') : ''}${postalcode}`
    }
    if (country) {
        result = `${result}${0 < result.length ? ', ' : ''}${country}`
    }
    return result
}
export function fullAddressToGeoAddress(address: FullAddress, coordinate?: GeoCoordinate): GeoAddress {
    return {
        address: joinFullAddress(address),
        city: address.city,
        state: address.state,
        country: address.country,
        coordinate
    }
}
export function parseFullAddress(addressLine: string): FullAddress {
    const parts = addressLine.split(',').map(t => t.trim()).filter(t => 0 < t.length)
    const street = parts[0]
    const city = 1 < parts.length ? parts[1] : undefined
    const [state, postalcode ] = 2 < parts.length ? parts[2].split(' ').map(t => t.trim()).filter(t => 0 < t.length) : [undefined, undefined]
    const country = 3 < parts.length ? parts[3] : undefined
    return {
        street,
        city,
        state,
        postalcode,
        country
    }
}

export function parseAddress(addressLine: string): { address: string, city?: string, state?: string, country?: string } {
    const address = addressLine
    const { city, state, country } = parseFullAddress(addressLine)
    return {
        address,
        city,
        state,
        country
    }
}
