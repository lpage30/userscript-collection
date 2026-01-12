import {
    GeodataSourceType,
    GeoCoordinate,
    isValidGeoCoordinate,
    toGeoPoint,
    GeojsonIndex,
} from './datatypes'
import { 
    GeocodedCountryStateCity,
    Place,
    PlaceDistance,
    GeocodedCountryStateCityAddress, 
    indexOfClosestOneInGeojson
} from './geocodedcountrystatecitytypes'
import { loadGeoJsonIndex } from './GeojsonIndex'
import { getCountryBaseInfo, getGeocodedCountry } from './generated_registered_country_state_city_map_functions'
import * as turf from '@turf/turf'
import { Units } from '@turf/turf'


async function findClosestCountryStateCity(geojson: GeojsonIndex, coordinate: GeoCoordinate): Promise<GeocodedCountryStateCity | undefined> {
    const countries = getCountryBaseInfo()
    const countryResult = indexOfClosestOneInGeojson(geojson, coordinate, countries)
    if (countryResult) {
        const country = await getGeocodedCountry(countries[countryResult.index].name)
        const states = Object.values(country.states)
        const stateResult = indexOfClosestOneInGeojson(geojson, coordinate, states)
        if (stateResult) {
            const state = states[stateResult.index]
            const cities = Object.values(state.cities)
            const cityResult = indexOfClosestOneInGeojson(geojson, coordinate, cities)
            return cityResult
                ? { country, state, city: cities[cityResult.index] }
                : { country, state }
        }
        return { country }
    }
    return undefined
}

function getGeojsonIndexes(geodataSource: GeodataSourceType, region: GeocodedCountryStateCity): number[] {
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


export async function findClosestGeodataPlace(geodataSource: GeodataSourceType, source: Place | GeocodedCountryStateCityAddress, distanceUnits: Units = 'miles'): Promise<PlaceDistance | undefined> {
    if (!isValidGeoCoordinate(source.coordinate)) return undefined

    interface ClosestPoint {
        geojson: GeojsonIndex | undefined,
        distance: number
        nearestPoint: GeoCoordinate
    }
    const { coordinate: { lat, lon }} = source
    const region: GeocodedCountryStateCity = source['region'] ?? source
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
