import {
    Geocoding,
    GeoCoordinate,
    Distance,
    toDistanceString,
    GeojsonIndex,
    isInPolygon,
    isValidGeoCoordinate,
} from './datatypes';
import {
    Country,
    State,
    City,
    CountryStateCity,
    toCityStateCountryString,
    CountryStateCityAddress,
    IndexOfClosestOne,
    indexOfClosestOne
} from './countrystatecitytypes';
import { getGeocodedCountry } from './generated_registered_country_state_city_map_functions';

export interface GeocodedCountryStateCityBase {
    geocoding: Geocoding
    distantMaxMiles: number
}

export interface GeocodedCity extends City, GeocodedCountryStateCityBase {
}

export interface GeocodedState extends State<GeocodedCity>, GeocodedCountryStateCityBase {
}

export interface GeocodedCountry extends Country<GeocodedCity, GeocodedState>, GeocodedCountryStateCityBase {
}

interface GeneratedGeocodedBase extends GeocodedCountryStateCityBase, Partial<GeoCoordinate> {
}
type GeneratedGeocodedCity = GeneratedGeocodedBase

interface GeneratedGeocodedState extends GeneratedGeocodedBase {
    cities: {
        [cityName: string]: GeneratedGeocodedCity
    }
}

export interface GeneratedGeocodedCountry extends GeneratedGeocodedBase {
    states: {
        [stateName: string]: GeneratedGeocodedState
    }
}
export interface GeocodedCountryStateCity extends CountryStateCity<GeocodedCity, GeocodedState> {
    country: GeocodedCountry,
    state?: GeocodedState,
    city?: GeocodedCity
}

export interface GeocodedCountryStateCityAddress extends GeocodedCountryStateCity {
    address?: string
    coordinate?: GeoCoordinate
}

export async function toGeocodedCountryStateCity(source: CountryStateCity): Promise<GeocodedCountryStateCity> {
    const country = await getGeocodedCountry(source.country.name)
    return {
        country,
        state: source.state ? country.states[source.state.name] : undefined,
        city: source.city && source.state ? country.states[source.state.name].cities[source.city.name] : undefined,
    }
}
export async function toGeocodedCountryStateCityAddress(source: CountryStateCityAddress): Promise<GeocodedCountryStateCityAddress> {
    const countryStateCity = await toGeocodedCountryStateCity(source as CountryStateCity)
    return {
        ...countryStateCity,
        address: source.address,
        coordinate: source.coordinate
    }
}
export function joinBaseAndGeocoded(base: Country, geocoded: GeneratedGeocodedCountry): GeocodedCountry {
    const states = Object.values(base.states).reduce((geocodedStates, baseState) => {
        const geocodedCities = Object.values(baseState.cities).reduce((geocodedCities, baseCity) => ({
            ...geocodedCities,
            [baseCity.name]: {
                ...baseCity,
                ...geocoded.states[baseState.name].cities[baseCity.name]
            } as GeocodedCity
        }), {} as { [cityName: string]: GeocodedCity })
        return {
            ...geocodedStates,
            [baseState.name]: {
                ...baseState,
                ...geocoded.states[baseState.name],
                cities: geocodedCities
            } as GeocodedState
        }
    }, {} as { [stateName: string]: GeocodedState })
    return {
        ...base,
        ...geocoded,
        states
    } as GeocodedCountry
}

export interface Place {
    coordinate: GeoCoordinate
    region?: GeocodedCountryStateCity
}
export interface PlaceDistance {
    place: Place
    distance: Distance
}
export const toPlaceString = (place: PlaceDistance): string => `${toDistanceString(place.distance)} ${toCityStateCountryString(place.place.region)}`


export function indexOfClosestOneInGeojson<T extends Partial<GeoCoordinate>>(
    geojson: GeojsonIndex, 
    source: GeoCoordinate, 
    collection: T[]
): IndexOfClosestOne | undefined {
    const filteredIndices = collection.map((item, index) => {
        const coords = (item['containedCoordinates'] ?? [item as GeoCoordinate]).filter(isValidGeoCoordinate)
        return coords.some((coord: GeoCoordinate) => isInPolygon(coord, geojson.polygon)) ? index : -1
    }).filter(i => 0 <= i)
    return indexOfClosestOne(source, collection, filteredIndices)
}

