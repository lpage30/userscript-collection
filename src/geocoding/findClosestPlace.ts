import {
    GeodataSourceType,
    GeoCoordinate,
    isValidGeoCoordinate,
    CountryStateCity,
    Country,
    State,
    City,
    Distance,
    GeoPlace,
    Place,
    toGeoPoint,
    measureDistance
} from './datatypes'
import { loadGeoJsonIndex } from './GeojsonIndex'
import { getCountries } from './generated_registered_geocoded_country_state_city_map'
import * as turf from '@turf/turf'
import { Units } from '@turf/turf'

function getDistance(source: GeoCoordinate, destination: Partial<GeoCoordinate>, distanceUnits: Units = 'miles'): Distance | undefined {
    if (!isValidGeoCoordinate(destination)) return undefined
    return {
        value: measureDistance(source, destination, distanceUnits),
        units: distanceUnits
    }
}

function getClosest<T extends Country | State | City>(geodataSource: GeodataSourceType, geojsonIndex: number, coordinate: GeoCoordinate, collection: T[]): T | undefined {
    interface ClosestLocation {
        distance: number
        location?: T
    }
    // isolate to just best ones 1st
    let closest = collection.filter(item => item.geocoding[geodataSource] && item.geocoding[geodataSource].geojsonIndexes.includes(geojsonIndex))
        .reduce((closest, item) => {
            const distance = getDistance(coordinate, item as GeoCoordinate)
            if (distance && distance.value < closest.distance) {
                return {
                    distance: distance.value,
                    location: item
                }
            }
            return closest

        }, { distance: Number.MAX_VALUE } as ClosestLocation).location
    if (closest) return closest

    // isolate to 2nd best
    closest = collection.filter(item => item.geocoding[geodataSource] && item.geocoding[geodataSource].distantGeojsonIndexes.includes(geojsonIndex))
        .reduce((closest, item) => {
            const distance = getDistance(coordinate, item as GeoCoordinate)
            if (distance && distance.value < closest.distance) {
                return {
                    distance: distance.value,
                    location: item
                }
            }
            return closest

        }, { distance: Number.MAX_VALUE } as ClosestLocation).location

    if (closest) return closest
    // brute force all the rest
    closest = collection.filter(item => item.geocoding[geodataSource] && 0 === (item.geocoding[geodataSource].distantGeojsonIndexes.length + item.geocoding[geodataSource].geojsonIndexes.length))
        .reduce((closest, item) => {
            const distance = getDistance(coordinate, item as GeoCoordinate)
            if (distance && distance.value < closest.distance) {
                return {
                    distance: distance.value,
                    location: item
                }
            }
            return closest

        }, { distance: Number.MAX_VALUE } as ClosestLocation).location
    return closest
}

function getGeojsonIndexes(geodataSource: GeodataSourceType, region: CountryStateCity): number[] {
    if (region.city && region.city.geocoding[geodataSource]) {
        if (0 < region.city.geocoding[geodataSource].geojsonIndexes.length) return [...region.city.geocoding[geodataSource].geojsonIndexes]
        if (0 < region.city.geocoding[geodataSource].distantGeojsonIndexes.length) return [...region.city.geocoding[geodataSource].distantGeojsonIndexes]
    }
    if (region.state && region.state.geocoding[geodataSource]) {
        if (0 < region.state.geocoding[geodataSource].geojsonIndexes.length) return [...region.state.geocoding[geodataSource].geojsonIndexes]
        if (0 < region.state.geocoding[geodataSource].distantGeojsonIndexes.length) return [...region.state.geocoding[geodataSource].distantGeojsonIndexes]
    }
    if (region.country && region.country.geocoding[geodataSource]) {
        if (0 < region.country.geocoding[geodataSource].geojsonIndexes.length) return [...region.country.geocoding[geodataSource].geojsonIndexes]
        if (0 < region.country.geocoding[geodataSource].distantGeojsonIndexes.length) return [...region.country.geocoding[geodataSource].distantGeojsonIndexes]
    }
    return []
}

function findCountryStateCity(geodataSource: GeodataSourceType, geojsonIndex: number, coordinate: GeoCoordinate): CountryStateCity | undefined {
    const foundCountry = getClosest<Country>(geodataSource, geojsonIndex, coordinate, getCountries())
    if (foundCountry) {
        const foundState = getClosest<State>(geodataSource, geojsonIndex, coordinate, Object.values(foundCountry.states))
        if (foundState) {
            const foundCity = getClosest<City>(geodataSource, geojsonIndex, coordinate, Object.values(foundState.cities))
            if (foundCity) return { country: foundCountry, state: foundState, city: foundCity }
            return { country: foundCountry, state: foundState }
        }
        return { country: foundCountry }
    }
    return undefined
}



export async function findClosestGeodataPlace(geodataSource: GeodataSourceType, source: GeoPlace, distanceUnits: Units = 'miles'): Promise<Place | undefined> {
    if (!isValidGeoCoordinate(source.coordinate)) return undefined

    interface ClosestPoint {
        geojsonIndex: number
        distance: number
        nearestPoint: GeoCoordinate
    }

    const { coordinate: { lat, lon }, region } = source
    const point = toGeoPoint({lat, lon})
    const geojsonIndices = getGeojsonIndexes(geodataSource, region)
    let closest: ClosestPoint = {
        geojsonIndex: -1,
        distance: Number.MAX_VALUE,
        nearestPoint: { lat, lon }
    }
    for (const index of geojsonIndices) {
        const geojson = await loadGeoJsonIndex(geodataSource, index)
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
    const foundRegion = findCountryStateCity(geodataSource, closest.geojsonIndex, closest.nearestPoint)
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
