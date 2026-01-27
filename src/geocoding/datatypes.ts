import { LineString, Feature, Polygon } from 'geojson'
import * as turf from '@turf/turf'

export interface CountryAddress {
    name: string
    codes: string[]
}
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
export const sameCoordinates = (left: GeoCoordinate, right: GeoCoordinate): boolean => left.lat === right.lat && left.lon === right.lon

export const isValidGeoCoordinate = (value: Partial<GeoCoordinate>): value is GeoCoordinate => undefined !== value && ![value.lat, value.lon].some(v => [null, undefined].includes(v))
export const toGeoPoint = (value: GeoCoordinate) => turf.point([value.lon, value.lat])
export const measureDistance = (source: GeoCoordinate, destination: GeoCoordinate, units: turf.Units = 'miles'): number => turf.distance(toGeoPoint(source), toGeoPoint(destination), { units })
export const isInPolygon = (value: GeoCoordinate, polygon: Feature<Polygon>) => turf.booleanPointInPolygon(toGeoPoint(value), polygon)

export const toGeoCoordinateString = (coordinate: GeoCoordinate): string =>
    coordinate ? `Lat: ${coordinate.lat}, Lon: ${coordinate.lon}` : 'Coordinates not disclosed'

export const toGoogleMapsPlace = (coordinate: GeoCoordinate): string | undefined =>
    coordinate ? `https://www.google.com/maps/place/${coordinate.lat},${coordinate.lon}` : undefined

export const toGoogleFromHereMapsDirections = (destinationCoordinate: GeoCoordinate): string | undefined => {
    if (destinationCoordinate) {
        return `https://www.google.com/maps/dir/?api=1&destination=${destinationCoordinate.lat},${destinationCoordinate.lon}`
    }
    return undefined
}
export const toGoogleMapsDirections = (originCoordinate: GeoCoordinate, destinationCoordinate: GeoCoordinate): string | undefined => {
    if (originCoordinate && destinationCoordinate) {
        return `https://www.google.com/maps/dir/?api=1&origin=${originCoordinate.lat},${originCoordinate.lon}&destination=${destinationCoordinate.lat},${destinationCoordinate.lon}`
    }
    if (originCoordinate) {
        return toGoogleMapsPlace(originCoordinate)
    }
    if (destinationCoordinate) {
        return toGoogleMapsPlace(destinationCoordinate)
    }
    return undefined
}


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
