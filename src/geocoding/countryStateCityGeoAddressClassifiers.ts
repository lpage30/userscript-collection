import {
    GeoCoordinate,
    GeoAddress,
    toGeoAddressString,
    isValidGeoCoordinate,
    measureDistance,
} from './datatypes'
import { Country, State, City, CountryStateCityAddress, indexOfClosestOne } from './countrystatecitytypes'
import { getCountries, getCountry } from './generated_registered_country_state_city_map_functions'
import {
    classifyCountryText,
    classifyStateText,
    classifyCityText,
    classifyStateCityText,
    findStateMatches,
    findCityMatches,
} from './countryStateCityTextClassifiers'

function classifyStateCityCoordinates<C extends City = City, S extends State<C> = State<C>>(coordinate: GeoCoordinate, country: Country<C, S>): { state: State<C>, city: C } | undefined {
    if (!isValidGeoCoordinate(coordinate)) return undefined

    const states = Object.values(country.states)
    const stateResult = indexOfClosestOne(coordinate, states)
    if (stateResult) {
        const cities = Object.values(states[stateResult.index].cities)
        const cityResult = indexOfClosestOne(coordinate, cities)
        if (cityResult) {
            return { state: states[stateResult.index], city: cities[cityResult.index] }
        }
    }
    return undefined
}

async function classifyGeoCountry(geoAddress: GeoAddress): Promise<Country> {
    if (geoAddress.country) {
        const country = await classifyCountryText(geoAddress.country)
        if (country) return country
    }
    const countries = await getCountries()
    if (isValidGeoCoordinate(geoAddress.coordinate)) {
        const countryResult = indexOfClosestOne(geoAddress.coordinate, countries)
        if (countryResult) return getCountry(countries[countryResult.index].name)
    }
    if (geoAddress.state) {

        for (const country of countries) {
            const states = findStateMatches(geoAddress.state, [country])
            if (0 < states.length) {
                return country
            }
        }
    }
    if (geoAddress.city) {
        for (const country of countries) {
            const cities = findCityMatches(geoAddress.city, [country])
            if (0 < cities.length) {
                return country
            }
        }
    }
    throw new Error(`Failed classifying country for ${toGeoAddressString(geoAddress)}`)
}

function classifyGeoState(geoAddress: GeoAddress, country: Country): State | undefined {
    if (geoAddress.state) {
        const stateName = classifyStateText(geoAddress.state, country)
        if (stateName) return country.states[stateName.name]
    }
    if (isValidGeoCoordinate(geoAddress.coordinate)) {
        const states = Object.values(country.states)
        const stateResult = indexOfClosestOne(geoAddress.coordinate, states)
        if (stateResult) {
            return states[stateResult.index]
        }
    }

    if (geoAddress.city) {
        const cities = findCityMatches(geoAddress.city, [country])
        if (0 < cities.length) {
            return country.states[cities[0].stateName]
        }
    }
    return undefined
}

function classifyGeoCity(geoAddress: GeoAddress, state: State): City | undefined {
    if (geoAddress.city) {
        const cityName = classifyCityText(geoAddress.city, state)
        if (cityName) return state.cities[cityName.name]
    }
    if (isValidGeoCoordinate(geoAddress.coordinate)) {
        const cities = Object.values(state.cities)
        const cityResult = indexOfClosestOne(geoAddress.coordinate, cities)
        if (cityResult) {
            return cities[cityResult.index]
        }
    }
    return undefined
}

function classifyGeoStateCity(geoAddress: GeoAddress, country: Country): { state: State, city: City } | undefined {
    if (geoAddress.city) {
        const stateCity = classifyStateCityText(geoAddress.city, country)
        if (stateCity) {
            return {
                state: stateCity.state,
                city: stateCity.city
            }
        }
    }
    const stateCity = classifyStateCityCoordinates(geoAddress.coordinate, country)
    if (stateCity) {
        return {
            state: stateCity.state,
            city: stateCity.city
        }
    }
    return undefined
}

export async function classifyGeoCountryStateCity(geoAddress: GeoAddress): Promise<CountryStateCityAddress> {
    const country = await classifyGeoCountry(geoAddress)
    let state: State = classifyGeoState(geoAddress, country)
    let city: City = undefined
    if (state) {
        if (geoAddress.city) {
            city = classifyGeoCity(geoAddress, state)
            if (city) {
                return {
                    address: geoAddress.address,
                    city,
                    state,
                    country,
                    coordinate: geoAddress.coordinate
                }
            } else {
                // try using state name as a city. known to have issues with this with UK
                const statecity = classifyGeoStateCity({ ...geoAddress, city: geoAddress.state }, country)
                if (statecity) {
                    console.log(`Found ${statecity.city.name} in ${statecity.state.name} using ${geoAddress.state} (state)  as city for ${toGeoAddressString(geoAddress)}`)
                    return {
                        address: geoAddress.address,
                        city: statecity.city,
                        state: statecity.state,
                        country,
                        coordinate: geoAddress.coordinate
                    }
                }
            }
        }
    }
    const statecity = classifyGeoStateCity(geoAddress, country)
    if (statecity) {
        return {
            address: geoAddress.address,
            city: statecity.city,
            state: statecity.state,
            country,
            coordinate: geoAddress.coordinate
        }
    }
    const missingDataMessage = undefined === state
        ? 'state and city'
        : `city in state ${state.name}`
    console.log(`Failed classifying ${missingDataMessage} for ${toGeoAddressString(geoAddress)} `)

    return {
        address: geoAddress.address,
        city,
        state,
        country,
        coordinate: geoAddress.coordinate
    }
}