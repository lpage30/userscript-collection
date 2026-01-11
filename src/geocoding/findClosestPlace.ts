import {
    GeodataSourceType,
    GeoCoordinate,
    isValidGeoCoordinate,
    CountryStateCity,
    Distance,
    GeoPlace,
    Place,
    toGeoPoint,
    measureDistance,
    GeojsonIndex,
    CountryNameIsoCode,
    StateNameIsoCode,
    CityName,
    isInPolygon
} from './datatypes'
import { loadGeoJsonIndex } from './GeojsonIndex'
import { getCountryNameIsoCodes, getCountry } from './generated_registered_geocoded_country_state_city_map'
import * as turf from '@turf/turf'
import { Units } from '@turf/turf'

function getDistance(source: GeoCoordinate, destination: Partial<GeoCoordinate>, distanceUnits: Units = 'miles'): Distance | undefined {
    if (!isValidGeoCoordinate(destination)) return undefined
    return {
        value: measureDistance(source, destination, distanceUnits),
        units: distanceUnits
    }
}

function getClosest<T extends CountryNameIsoCode | StateNameIsoCode | CityName>(geojson: GeojsonIndex, coordinate: GeoCoordinate, collection: T[]): T | undefined {
    interface ClosestLocation {
        distance: number
        location?: T
    }
    // isolate to just best ones 1st
    return collection
        .filter(item => {
            const coords = (item['containedCoordinates'] ?? [item as GeoCoordinate]).filter(isValidGeoCoordinate)
            return coords.some((coord: GeoCoordinate) => isInPolygon(coord, geojson.polygon))
        }).reduce((closest: ClosestLocation, item: T) => {
            const distance = getDistance(coordinate, item as GeoCoordinate)
            if (distance && distance.value < closest.distance) {
                return {
                    distance: distance.value,
                    location: item
                }
            }
            return closest

        }, { distance: Number.MAX_VALUE } as ClosestLocation).location
}
async function findClosestCountryStateCity(geojson: GeojsonIndex, coordinate: GeoCoordinate): Promise<CountryStateCity | undefined> {
    const foundCountry = getClosest<CountryNameIsoCode>(geojson, coordinate, getCountryNameIsoCodes())
    if (foundCountry) {
        const country = await getCountry(foundCountry.name)
        const foundState = getClosest<StateNameIsoCode>(geojson, coordinate, foundCountry.states)
        if (foundState) {
            const state = country.states[foundState.name]
            const foundCity = getClosest<CityName>(geojson, coordinate, foundState.cities)
            if (foundCity) return { country, state, city: state.cities[foundCity.name] }
            return { country, state }
        }
        return { country }
    }
    return undefined
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


export async function findClosestGeodataPlace(geodataSource: GeodataSourceType, source: GeoPlace, distanceUnits: Units = 'miles'): Promise<Place | undefined> {
    if (!isValidGeoCoordinate(source.coordinate)) return undefined

    interface ClosestPoint {
        geojson: GeojsonIndex | undefined,
        distance: number
        nearestPoint: GeoCoordinate
    }

    const { coordinate: { lat, lon }, region } = source
    const point = toGeoPoint({lat, lon})
    const geojsonIndices = getGeojsonIndexes(geodataSource, region)
    let closest: ClosestPoint = {
        geojson: undefined,
        distance: Number.MAX_VALUE,
        nearestPoint: { lat, lon }
    }
    for (const index of geojsonIndices) {
        const geojson = await loadGeoJsonIndex(geodataSource, index)
        const nearestPoint = turf.nearestPointOnLine(geojson.lineString, point).geometry
        const distance = turf.distance(point, nearestPoint, { units: distanceUnits })
        if (distance < closest.distance) {
            closest = {
                geojson: geojson,
                distance,
                nearestPoint: { lat: nearestPoint.coordinates[1], lon: nearestPoint.coordinates[0] }
            }
        }
    }
    if (undefined === closest.geojson) return undefined

    const foundRegion = await findClosestCountryStateCity(closest.geojson, closest.nearestPoint)
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
