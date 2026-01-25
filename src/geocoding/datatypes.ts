import { LineString, Feature, Polygon } from 'geojson'
import * as turf from '@turf/turf'

export interface CountryAddress {
    name: string
    codes: string[]
}
function addressContainsCountry(addressLine: string, countryAddress: CountryAddress): boolean {
    return addressLine.endsWith(countryAddress.name) ||
        countryAddress.codes.some(code => addressLine.endsWith(code))
}
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
    const { street, city, state, postalcode, country } = address
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
export function parseFullAddress(addressLine: string, countryAddress?: CountryAddress): FullAddress {
    const addressHasCountry = countryAddress ? addressContainsCountry(addressLine, countryAddress) : true
    const parts = addressLine.split(',').map(t => t.trim()).filter(t => 0 < t.length)
    switch (parts.length) {
        case 1:
            if (addressHasCountry) return { country: parts[0] }
            return { state: parts[0], country: countryAddress?.name }
        case 2: {
            if (addressHasCountry) {
                const [state, postalcode] = parts[0].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
                const country = parts[1]
                return {
                    state,
                    postalcode,
                    country
                }
            }
            const [state, postalcode] = parts[1].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
            return {
                city: parts[0],
                state,
                postalcode,
                country: countryAddress?.name
            }
        }
        case 3: {
            if (addressHasCountry) {
                const [state, postalcode] = parts[1].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
                const country = parts[2]
                return {
                    city: parts[0],
                    state,
                    postalcode,
                    country
                }
            }
            const [state, postalcode] = parts[2].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
            return {
                street: parts[0],
                city: parts[1],
                state,
                postalcode,
                country: countryAddress?.name
            }
        }
        case 4:
        default: {
            if (addressHasCountry) {
                const [state, postalcode] = parts[2].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
                const country = parts[3]
                return {
                    street: parts[0],
                    city: parts[1],
                    state,
                    postalcode,
                    country
                }
            }
            const [state, postalcode] = parts[3].split(' ').map(t => t.trim()).filter(t => 0 < t.length)
            return {
                street: `${parts[0]} ${parts[1]}`,
                city: parts[2],
                state,
                postalcode,
                country: countryAddress?.name
            }
        }
    }
}

export function parseAddress(addressLine: string, countryAddress?: CountryAddress): { address: string, city?: string, state?: string, country?: string } {
    const fullAddress = parseFullAddress(addressLine, countryAddress)
    return {
        address: joinFullAddress(fullAddress),
        city: fullAddress.city,
        state: fullAddress.state,
        country: fullAddress.country
    }
}
