import { getCountryNameIsoCodes, getCountry} from './generated_registered_geocoded_country_state_city_map'
import { CountryNameIsoCode, StateNameIsoCode, CityName, CountryStateCity, isDataMatch } from './datatypes'

export function findDataMatches<T extends CountryNameIsoCode | StateNameIsoCode | CityName>(text: string, data: T[]): T[] {
    return data.filter(result => isDataMatch(text, result))
}

export function findStateMatches(text: string, countries: CountryNameIsoCode[]): StateNameIsoCode[] {
    return countries
        .map(country => findDataMatches(text, Object.values(country.states))).flat()
}

export function findCityMatches(text: string, countries: CountryNameIsoCode[]): CityName[] {
    return countries
        .map(country => country.states
            .map(state => findDataMatches(text, state.cities)).flat()
        ).flat()
}
export const classifyCountryText = (text: string): CountryNameIsoCode | undefined => findDataMatches(text, getCountryNameIsoCodes())[0]

export const classifyStateText = (text: string, country: CountryNameIsoCode): StateNameIsoCode | undefined => findDataMatches(text, Object.values(country.states))[0]

export const classifyCityText = (text: string, state: StateNameIsoCode): CityName | undefined => findDataMatches(text, state.cities)[0]


export function classifyStateCityText(text: string, country: CountryNameIsoCode): { state: StateNameIsoCode, city: CityName } | undefined {
    const city = findCityMatches(text, [country])[0]
    return city ? { state: country.states[city.stateName], city } : undefined
}

export async function classifyCountryStateCityText(text: string): Promise<CountryStateCity | undefined> {
    const country: CountryNameIsoCode = classifyCountryText(text)
    let state: StateNameIsoCode = country ? classifyStateText(text, country) : undefined
    let city: CityName = state ? classifyCityText(text, state) : undefined``
    if (undefined === state) {
        const stateCity = country ? classifyStateCityText(text, country) : undefined
        state = (stateCity ?? {}).state
        city = (stateCity ?? {}).city
    }
    if (country) {
        const countryObj = await getCountry(country.name)
        const stateObj = state ? countryObj.states[state.name] : undefined
        const cityObj = city ? state.cities[city.name] : undefined
        return {
            country: countryObj,
            state: stateObj,
            city: cityObj
        }
    }
    return undefined
}

export interface ComparableCountryStateCityText {
    text?: string
    location?: CountryStateCity
}

export function compareFunction(l: ComparableCountryStateCityText, r: ComparableCountryStateCityText, compareTextonNoLocation: boolean = true): number {
    function compareTextFunction(l?: string, r?: string): number {
        if (l && r) {
            return l.localeCompare(r)
        }
        return l ? -1 : r ? 1 : 0
    }
    if (l.location && r.location) {
        if (l.location.country && r.location.country) {
            if (l.location.country.name === r.location.country.name) {
                if (l.location.state && r.location.state) {
                    if (l.location.state.name === r.location.state.name) {
                        if (l.location.city && r.location.city) {
                            if (l.location.city.name === r.location.city.name) {
                                return compareTextFunction(l.text, r.text)
                            }
                            return l.location.city.name.localeCompare(r.location.city.name)
                        }
                        return l.location.city ? -1 : r.location.city ? 1 : compareTextFunction(l.text, r.text)
                    }
                    return l.location.state.name.localeCompare(r.location.state.name)
                }
                return l.location.state ? -1 : r.location.state ? 1 : compareTextFunction(l.text, r.text)
            }
            return r.location.country.name.localeCompare(l.location.country.name)
        }
        return l.location.country ? -1 : r.location.country ? 1 : compareTextFunction(l.text, r.text)
    }
    return l.location ? -1 : r.location ? 1 : compareTextonNoLocation ? compareTextFunction(l.text, r.text) : 0
}