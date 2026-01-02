import { GeoCoordinate, CountryStateCity, Country, State, City, GeoAddress, GeoCountryStateCity, Distance, GeoPlace, Place } from './datatypes'
import { loadGeoJsonIndex } from './GeojsonIndex'
import { CountryStateCityMap } from './CountryStateCityMap'
import { classifyCountryStateCity, classifyCountry, classifyState, classifyCity, classifyStateCity } from './countryStateCityService'
import * as turf from '@turf/turf'
import { Units } from '@turf/turf'

export function classifyGeoCountryStateCity(geoAddress: GeoAddress): GeoCountryStateCity {
    if ([geoAddress.state, geoAddress.city].every(v => [undefined, null].includes(v))) {
        const countryStateCity = classifyCountryStateCity(`${geoAddress.address}, ${geoAddress.country}`)
        return {
            ...countryStateCity,
            address: geoAddress.address,
            coordinate: geoAddress.coordinate
        }
    }
    const country = classifyCountry(geoAddress.country)
    if (geoAddress.state) {
        const state = classifyState(geoAddress.state, country)
        if (geoAddress.city) {
            const city = classifyCity(geoAddress.city, state)
            return {
                country, state, city,
                address: geoAddress.address,
                coordinate: geoAddress.coordinate
            }
        }
        return {
            country, state,
            address: geoAddress.address,
            coordinate: geoAddress.coordinate
        }
    }
    const { state, city } = classifyStateCity(geoAddress.city, country)
    return {
        country, state, city,
        address: geoAddress.address,
        coordinate: geoAddress.coordinate
    }
}

export function getDistance(source: GeoCoordinate, destination: Partial<GeoCoordinate>, distanceUnits: Units = 'miles'): Distance | undefined {
    if ([destination.lat, destination.lon].some(v => [undefined, null].includes(v))) return undefined
    const sourcePt = turf.point([source.lon, source.lat])
    const destinationPt = turf.point([destination.lon, destination.lat])
    return {
        value: turf.distance(sourcePt, destinationPt, { units: distanceUnits }),
        units: distanceUnits
    }
}

export function getClosest<T extends Country | State | City>(geojsonIndex: number, coordinate: GeoCoordinate, collection: T[]): T | undefined {
    interface ClosestLocation {
        distance: number
        location?: T
    }
    // isolate to just best ones 1st
    let closest = collection.filter(item => item.geojsonIndexes.includes(geojsonIndex))
        .reduce((closest, item) => {
            const distance = getDistance(coordinate, item as GeoCoordinate)
            if (distance && closest.distance < distance.value) {
                return {
                    distance: distance.value,
                    location: item
                }
            }
            return closest

        }, { distance: Number.MAX_VALUE } as ClosestLocation).location
    if (closest) return closest

    // isolate to 2nd best
    closest = collection.filter(item => item.distantGeojsonIndexes.includes(geojsonIndex))
        .reduce((closest, item) => {
            const distance = getDistance(coordinate, item as GeoCoordinate)
            if (distance && closest.distance < distance.value) {
                return {
                    distance: distance.value,
                    location: item
                }
            }
            return closest

        }, { distance: Number.MAX_VALUE } as ClosestLocation).location

    if (closest) return closest
    // brute force all the rest
    closest = collection.filter(item => 0 === (item.distantGeojsonIndexes.length + item.geojsonIndexes.length))
        .reduce((closest, item) => {
            const distance = getDistance(coordinate, item as GeoCoordinate)
            if (distance && closest.distance < distance.value) {
                return {
                    distance: distance.value,
                    location: item
                }
            }
            return closest

        }, { distance: Number.MAX_VALUE } as ClosestLocation).location
    return closest

}

export function getGeojsonIndexes(region: CountryStateCity): number[] {
    if (region.city) {
        if (0 < region.city.geojsonIndexes.length) return [...region.city.geojsonIndexes]
        if (0 < region.city.distantGeojsonIndexes.length) return [...region.city.distantGeojsonIndexes]
    }
    if (region.state) {
        if (0 < region.state.geojsonIndexes.length) return [...region.state.geojsonIndexes]
        if (0 < region.state.distantGeojsonIndexes.length) return [...region.state.distantGeojsonIndexes]
    }
    if (region.country) {
        if (0 < region.country.geojsonIndexes.length) return [...region.country.geojsonIndexes]
        if (0 < region.country.distantGeojsonIndexes.length) return [...region.country.distantGeojsonIndexes]
    }
    return []
}

export function findCountryStateCity(geojsonIndex: number, coordinate: GeoCoordinate): CountryStateCity | undefined {
    const foundCountry = getClosest<Country>(geojsonIndex, coordinate, Object.values(CountryStateCityMap))
    if (foundCountry) {
        const foundState = getClosest<State>(geojsonIndex, coordinate, Object.values(foundCountry.states))
        if (foundState) {
            const foundCity = getClosest<City>(geojsonIndex, coordinate, Object.values(foundState.cities))
            if (foundCity) return { country: foundCountry, state: foundState, city: foundCity }
            return { country: foundCountry, state: foundState}
        }
        return { country: foundCountry }
    }
    return undefined
}

export async function findClosestOceanPlace(source: GeoPlace, distanceUnits: Units = 'miles'): Promise<Place | undefined> {
    if ([null, undefined].includes(source.coordinate)) return undefined

    interface ClosestPoint {
        geojsonIndex: number
        distance: number
        nearestPoint: GeoCoordinate
    }
    
    const { coordinate: { lat, lon }, region } = source
    const point = turf.point([lon, lat])
    const geojsonIndices = getGeojsonIndexes(region)
    let closest: ClosestPoint = {
        geojsonIndex: -1,
        distance: Number.MAX_VALUE,
        nearestPoint: { lat, lon }
    }
    for (const index of geojsonIndices) {
        const geojson = await loadGeoJsonIndex(index)
        const nearestPoint = turf.nearestPointOnLine(geojson.lineString, point).geometry
        const distance = turf.distance(point, nearestPoint, { units: distanceUnits })
        if (distance < closest.distance) {
            closest = {
                geojsonIndex: index,
                distance,
                nearestPoint: { lat: nearestPoint.coordinates[1], lon: nearestPoint.coordinates[0] }
            }
        }
    }
    if (closest.geojsonIndex < 0) return undefined
    const foundRegion = findCountryStateCity(closest.geojsonIndex, closest.nearestPoint)
    return {
        distance: {
            value: closest.distance,
            units: distanceUnits,
        },
        place: {
            coordinate: closest.nearestPoint,
            region: foundRegion
        }
    }
}