import { LineString, Feature, Polygon } from 'geojson'
import * as turf from '@turf/turf'

export type GeodataSourceType = 'tl_2025_us_coastline' | 'ukcp18_uk_marine_coastline_hires'

export interface GeojsonIndex {
    source: GeodataSourceType
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

export interface Distance {
    value: number
    units: turf.Units
}
export const toDistanceString = (distance: Distance): string => `${distance.value.toFixed(2)} ${distance.units}`

export function toNameRegex(name: string): RegExp {
    return new RegExp(`^([,\\s]*|.*[,\\s]+)${name}([,\\s]*|[,\\s]+.*)$`, 'ig')
}
export function parseAddress(addressLine: string): { address: string, city?: string, state?: string, country?: string } {
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