import {
    GeoCoordinate,
    GeoAddress,
    toGeoAddressString,
    GeoCountryStateCityAddress,
    Country,
    isValidGeoCoordinate,
    State,
    City,
    measureDistance
} from './datatypes'
import { getCountries, getCountry } from './generated_registered_geocoded_country_state_city_map'
import {
    classifyCountryText,
    classifyStateText,
    classifyCityText,
    classifyStateCityText,
    findStateMatches,
    findCityMatches,
} from './countryStateCityTextClassifiers'

function pickClosestOne<T extends Partial<GeoCoordinate>>(
    coordinate: GeoCoordinate,
    collection: T[]
): T | undefined {
    if (!isValidGeoCoordinate(coordinate)) return undefined
    return collection
        .reduce((closest: { distance: number, result?: T}, result: T) => {
            if (!isValidGeoCoordinate(result)) return closest
            const distance = measureDistance(coordinate, result)
            return distance < closest.distance
                ? { distance, result }
                : closest
        }, { distance: Number.MAX_VALUE, result: undefined }).result   
}

function classifyStateCityCoordinates(coordinate: GeoCoordinate, country: Country): { state: State, city: City } | undefined {
    if (!isValidGeoCoordinate(coordinate)) return undefined
    type ClosestCityState = { distance: number, state?: State, city?: City }
    
    const result = Object.values(country.states).reduce((closest: ClosestCityState, state: State) => Object.values(state.cities)
        .filter(isValidGeoCoordinate)
        .reduce((closestCity: ClosestCityState, city: City) => {
            const distance = measureDistance(coordinate, city as GeoCoordinate)
            return distance < closestCity.distance
                ? { distance, state, city }
                : closestCity
        }, closest),
        { distance: Number.MAX_VALUE, state: undefined, city: undefined }
    )
    return result.city ? { state: result.state, city: result.city } : undefined
}

function classifyGeoCountry(geoAddress: GeoAddress): Country {
    let country: Country = undefined
    if (geoAddress.country) {
        country = classifyCountryText(geoAddress.country)
        if (country) return country
    }
    if (geoAddress.state) {
        const states = findStateMatches(geoAddress.state, getCountries())
        if (0 < states.length) {
            const state = (isValidGeoCoordinate(geoAddress.coordinate)
                ? pickClosestOne(geoAddress.coordinate, states)
                : states[0])
            country = getCountry(state.countryName)
            return country
        }
    }
    if (geoAddress.city) {
        const cities = findCityMatches(geoAddress.city, getCountries())
        if (0 < cities.length) {
            const city = (isValidGeoCoordinate(geoAddress.coordinate)
                ? pickClosestOne(geoAddress.coordinate, cities)
                : cities[0])
            country = getCountry(city.countryName)
            return country
        }
    }
    country = (isValidGeoCoordinate(geoAddress.coordinate)
        ? pickClosestOne(geoAddress.coordinate, getCountries())
        : undefined)

    if (undefined === country) {
        throw new Error(`Failed classifying country for ${toGeoAddressString(geoAddress)}`)
    }
    return country
}

function classifyGeoState(geoAddress: GeoAddress, country: Country): State | undefined{
    let state: State = undefined
    if (geoAddress.state) {
        state = classifyStateText(geoAddress.state, country)
        if (state) return state
    }
    if (geoAddress.city) {
        const cities = findCityMatches(geoAddress.city, [country])
        if (0 < cities.length) {
            const city = (isValidGeoCoordinate(geoAddress.coordinate)
                ? pickClosestOne(geoAddress.coordinate, cities)
                : cities[0])
            state = getCountry(city.countryName).states[city.stateName]
            return state
        }
    }
    state = (isValidGeoCoordinate(geoAddress.coordinate)
        ? pickClosestOne(geoAddress.coordinate, Object.values(country.states))
        : undefined )
    
    return state
}

function classifyGeoCity(geoAddress: GeoAddress, state: State): City | undefined {
    let city: City = undefined
    if (geoAddress.city) {
        city = classifyCityText(geoAddress.city, state)
        if (city) return city
    }
    city = (isValidGeoCoordinate(geoAddress.coordinate)
        ? pickClosestOne(geoAddress.coordinate, Object.values(state.cities))
        : undefined)
    
    return city
}

function classifyGeoStateCity(geoAddress: GeoAddress, country: Country): { state: State, city: City } | undefined {
    let result: { state: State, city: City } = undefined
    if (geoAddress.city) {
        result = classifyStateCityText(geoAddress.city, country)
        if (result) return result
    }
    result = classifyStateCityCoordinates(geoAddress.coordinate, country)
    return result
}

export function classifyGeoCountryStateCity(geoAddress: GeoAddress): GeoCountryStateCityAddress {
    const country = classifyGeoCountry(geoAddress)
    let state: State = classifyGeoState(geoAddress, country)
    let city: City = undefined
    if (undefined === state) {
        const statecity = classifyGeoStateCity(geoAddress, country)
        if (statecity) {
            state = statecity.state
            city = statecity.city
        }
    }
    if (undefined === city) {
        if (geoAddress.city) {
            city = classifyGeoCity(geoAddress, state)
            if (undefined === city) {
                const statecity = classifyGeoStateCity({...geoAddress, city: geoAddress.state}, country)
                if (statecity) {
                    state = statecity.state
                    city = statecity.city
                    console.log(`Found ${city.name} in ${state.name} using city = ${geoAddress.state} (state) for ${toGeoAddressString(geoAddress)}`)
                }
            }
        }
        if (undefined === city && isValidGeoCoordinate(geoAddress.coordinate)) {
            const statecity = classifyStateCityCoordinates(geoAddress.coordinate, country)
            if (statecity) {
                state = statecity.state
                city = statecity.city
            }

        }
    }
    if ([city, state].includes(undefined)) {
        const missingDataMessage = undefined === city 
            ? undefined === state 
                ? 'state and city'
                : `city in state ${state.name}`
            : undefined === state 
                ? `state with city ${city.name}`
                : ''
        console.log(`Failed classifying ${missingDataMessage} for ${toGeoAddressString(geoAddress)} `)
    }
    return {
            address: geoAddress.address,
            city,
            state,
            country,
            coordinate: geoAddress.coordinate
        }
}