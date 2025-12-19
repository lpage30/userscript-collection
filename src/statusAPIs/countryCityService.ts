import { Country, State, City } from 'country-state-city';

const countryNameCodeMap: { [Name: string]: string } = Country.getAllCountries().reduce((NameCodeMap, { name, isoCode }) => ({
    ...NameCodeMap,
    [name]: isoCode
}), {})

const countryCodeStateCodeNamesMap: { [Code: string]: { stateCode: string, name: string }[] } = State.getAllStates().reduce((CodeCodesMap, { countryCode, isoCode, name }) => {
    if (undefined === CodeCodesMap[countryCode]) {
        CodeCodesMap[countryCode] = []
    }
    CodeCodesMap[countryCode].push({ stateCode: isoCode, name })
    return CodeCodesMap
}, {})

const countryStateCodeCitiesMap: { [CountryStateCode: string]: string[] } = City.getAllCities().reduce((CountryStateCodeCityMap, { name, countryCode, stateCode }) => {
    const countryStateCode = `${countryCode}-${stateCode}`
    if (undefined === CountryStateCodeCityMap[countryStateCode]) {
        CountryStateCodeCityMap[countryStateCode] = []
    }
    CountryStateCodeCityMap[countryStateCode].push(name)
    return CountryStateCodeCityMap
}, {})

interface State {
    name: string
    cities: string[]
}
interface Country {
    name: string
    states: { [state: string]: State }
}
export interface CountryStateCity {
    country: string
    state?: string
    city?: string
}

const CountryStateCityMap: { [country: string]: Country } = Object.entries(countryNameCodeMap)
    .map(([countryName, countryCode]): CountryStateCity[] => {
        const countryStateMap = countryCodeStateCodeNamesMap[countryCode]
        if (undefined === countryStateMap) return [{ country: countryName }]
        return countryStateMap
            .map(({ stateCode, name }): CountryStateCity[] => {
                const countryStateCityMap = countryStateCodeCitiesMap[`${countryCode}-${stateCode}`]
                if (undefined === countryStateCityMap) return [{ country: countryName, state: name }]                
                return countryStateCityMap
                .map(cityName => ({ country: countryName, state: name, city: cityName }))
        }).flat()
    }).flat()
    .reduce((countryStateCityMap, { country, state, city }) => {
        if (undefined === countryStateCityMap[country]) {
            countryStateCityMap[country] = {
                name: country,
                states: {}
            }
        }
        if (undefined === state) return countryStateCityMap
        if (undefined === countryStateCityMap[country].states[state]) {
            countryStateCityMap[country].states[state] = {
                name: state,
                cities: []
            }
        }
        if (undefined === city) return countryStateCityMap
        countryStateCityMap[country].states[state].cities.push(city)
        return countryStateCityMap
    }, {})


export function classifyCountryStateCity(text: string): CountryStateCity | undefined {
    const lcText = (text ?? '').toLowerCase()
    let foundCountry = undefined
    let foundState = undefined
    let foundCity = undefined
    foundCountry = Object.keys(CountryStateCityMap).find(countryName => lcText.includes(countryName.toLowerCase()))
    if (foundCountry) {
        foundState = Object.keys(CountryStateCityMap[foundCountry].states).find(stateName => lcText.includes(stateName.toLowerCase()))
        if (foundState) {
            foundCity = CountryStateCityMap[foundCountry].states[foundState].cities.find(cityName => lcText.includes(cityName.toLowerCase()))
        } else {
            Object.values(CountryStateCityMap[foundCountry].states).find(({ name, cities }) => {
                foundCity = cities.find(cityName => lcText.includes(cityName.toLowerCase()))
                return foundCity !== undefined
            })
        }
    }
    return foundCountry ? { country: foundCountry, state: foundState, city: foundCity } : undefined
}
export interface ComparableTextCountryStateCity {
    text?: string
    location?: CountryStateCity
}
function compareTextFunction(l?: string, r?: string): number {
    if (l && r) {
        return l.localeCompare(r)
    }
    return l ? -1 : r ? 1 : 0
}
export function compareFunction(l: ComparableTextCountryStateCity, r: ComparableTextCountryStateCity, compareTextonNoLocation: boolean = true): number {
    if (l.location && r.location) {
        if (l.location.country && r.location.country) {
            if (l.location.country === r.location.country) {
                if (l.location.state && r.location.state) {
                    if (l.location.state === r.location.state) {
                        if (l.location.city && r.location.city) {
                            if (l.location.city === r.location.city) {
                                return compareTextFunction(l.text, r.text)
                            }
                            return l.location.city.localeCompare(r.location.city)
                        }
                        return l.location.city ? -1 : r.location.city ? 1 : compareTextFunction(l.text, r.text)
                    }
                    return l.location.state.localeCompare(r.location.state)
                }
                return l.location.state ? -1 : r.location.state ? 1 : compareTextFunction(l.text, r.text)
            }
            return r.location.country.localeCompare(l.location.country)
        }
        return l.location.country ? -1 : r.location.country ? 1 : compareTextFunction(l.text, r.text)
    }
    return l.location ? -1 : r.location ? 1 : compareTextonNoLocation ? compareTextFunction(l.text, r.text) : 0
}

