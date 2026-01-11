import {
    GeoCoordinate,
    GeoAddress,
    toGeoAddressString,
    GeoCountryStateCityAddress,
    CountryNameIsoCode,
    isValidGeoCoordinate,
    StateNameIsoCode,
    CityName,
    measureDistance,
    Country,
    toCountryNameIsoCode,
    State,
    toStateNameIsoCode,
    City
} from './datatypes'
import { getCountryNameIsoCodes, getCountry } from './generated_registered_geocoded_country_state_city_map'
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

function classifyStateCityCoordinates(coordinate: GeoCoordinate, country: CountryNameIsoCode): { state: StateNameIsoCode, city: CityName } | undefined {
    if (!isValidGeoCoordinate(coordinate)) return undefined
    type ClosestCityState = { distance: number, state?: StateNameIsoCode, city?: CityName }
    
    const result = Object.values(country.states).reduce((closest: ClosestCityState, state: StateNameIsoCode) => Object.values(state.cities)
        .filter(isValidGeoCoordinate)
        .reduce((closestCity: ClosestCityState, city: CityName) => {
            const distance = measureDistance(coordinate, city as GeoCoordinate)
            return distance < closestCity.distance
                ? { distance, state, city }
                : closestCity
        }, closest),
        { distance: Number.MAX_VALUE, state: undefined, city: undefined }
    )
    return result.city ? { state: result.state, city: result.city } : undefined
}

async function classifyGeoCountry(geoAddress: GeoAddress): Promise<Country> {
    if (geoAddress.country) {
        const countryName = classifyCountryText(geoAddress.country)
        if (countryName) return getCountry(countryName.name)
    }
    if (geoAddress.state) {
        const states = findStateMatches(geoAddress.state, getCountryNameIsoCodes())
        if (0 < states.length) {

            const state = (isValidGeoCoordinate(geoAddress.coordinate)
                ? pickClosestOne(geoAddress.coordinate, states)
                : states[0])
            return getCountry(state.countryName)
        }
    }
    if (geoAddress.city) {
        const cities = findCityMatches(geoAddress.city, getCountryNameIsoCodes())
        if (0 < cities.length) {
            const city = (isValidGeoCoordinate(geoAddress.coordinate)
                ? pickClosestOne(geoAddress.coordinate, cities)
                : cities[0])
            return getCountry(city.countryName)
        }
    }
    const countryName = (isValidGeoCoordinate(geoAddress.coordinate)
        ? pickClosestOne(geoAddress.coordinate, getCountryNameIsoCodes())
        : undefined)

    if (undefined === countryName) {
        throw new Error(`Failed classifying country for ${toGeoAddressString(geoAddress)}`)
    }
    return getCountry(countryName.name)
}

function classifyGeoState(geoAddress: GeoAddress, country: Country): State | undefined {
    const countryName = toCountryNameIsoCode(country)
    if (geoAddress.state) {
        const stateName = classifyStateText(geoAddress.state, countryName)
        if (stateName) return country.states[stateName.name]
    }
    if (geoAddress.city) {
        const cities = findCityMatches(geoAddress.city, [countryName])
        if (0 < cities.length) {
            const city = (isValidGeoCoordinate(geoAddress.coordinate)
                ? pickClosestOne(geoAddress.coordinate, cities)
                : cities[0])
            return country.states[city.stateName]
        }
    }
    const stateName = (isValidGeoCoordinate(geoAddress.coordinate)
        ? pickClosestOne(geoAddress.coordinate, countryName.states)
        : undefined )
    
    return stateName ? country.states[stateName.name] : undefined
}

function classifyGeoCity(geoAddress: GeoAddress, state: State): City | undefined {
    const stateName = toStateNameIsoCode(state)
    if (geoAddress.city) {
        const cityName = classifyCityText(geoAddress.city, stateName)
        if (cityName) return state.cities[cityName.name]
    }
    const cityName = (isValidGeoCoordinate(geoAddress.coordinate)
        ? pickClosestOne(geoAddress.coordinate, stateName.cities)
        : undefined)
    
    return cityName ? state.cities[cityName.name] : undefined
}

function classifyGeoStateCity(geoAddress: GeoAddress, country: Country): { state: State, city: City } | undefined {
    const countryName = toCountryNameIsoCode(country)

    if (geoAddress.city) {
        const stateCityName = classifyStateCityText(geoAddress.city, countryName)
        if (stateCityName){
            return {
                state: country.states[stateCityName.state.name],
                city: country.states[stateCityName.state.name].cities[stateCityName.city.name]
            }
        }
    }
    const stateCityName = classifyStateCityCoordinates(geoAddress.coordinate, countryName)
    if (stateCityName){
        return {
            state: country.states[stateCityName.state.name],
            city: country.states[stateCityName.state.name].cities[stateCityName.city.name]
        }
    }
    return undefined
}

export async function classifyGeoCountryStateCity(geoAddress: GeoAddress): Promise<GeoCountryStateCityAddress> {
    const country = await classifyGeoCountry(geoAddress)
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
            const countryName = toCountryNameIsoCode(country)
            const statecity = classifyStateCityCoordinates(geoAddress.coordinate, countryName)
            if (statecity) {
                state = country.states[statecity.state.name]
                city = country.states[statecity.state.name].cities[statecity.city.name]
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