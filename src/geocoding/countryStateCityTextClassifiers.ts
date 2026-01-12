import { CountryStateBase, CityBase, isDataMatch, Country, State, City, CountryStateCity } from './countrystatecitytypes'
import { getCountryBaseInfo, getCountry } from './generated_registered_country_state_city_map_functions'

export function findDataMatches<T extends CountryStateBase | CityBase>(text: string, data: T[]): T[] {
    return data.filter(result => isDataMatch(text, result))
}

export function findStateMatches<C extends City = City, S extends State<C> = State<C>>(text: string, countries: Country<C, S>[]): State<C>[] {
    return countries
        .map(country => findDataMatches(text, Object.values(country.states))).flat()
}

export function findCityMatches<C extends City = City, S extends State<C> = State<C>>(text: string, countries: Country<C, S>[]): C[] {
    return countries
        .map(country => Object.values(country.states)
            .map(state => findDataMatches(text, Object.values(state.cities))).flat()
        ).flat()
}
export const classifyCountryText = (text: string): CountryStateBase | undefined => findDataMatches(text, getCountryBaseInfo())[0]

export const classifyStateText = <C extends City = City, S extends State<C> = State<C>>(text: string, country: Country<C, S>): State<C> | undefined => findDataMatches(text, Object.values(country.states))[0]

export const classifyCityText = <C extends City = City>(text: string, state: State<C>): C | undefined => findDataMatches(text, Object.values(state.cities))[0]


export function classifyStateCityText<C extends City = City, S extends State<C> = State<C>>(text: string, country: Country<C, S>): { state: State<C>, city: C } | undefined {
    const city = findCityMatches(text, [country])[0]
    return city ? { state: country.states[city.stateName], city } : undefined
}

export async function classifyCountryStateCityText(text: string): Promise<CountryStateCity | undefined> {
    const countryBase: CountryStateBase = classifyCountryText(text)
    const country = countryBase ? await getCountry(countryBase.name) : undefined
    let state: State = country ? classifyStateText(text, country) : undefined
    let city: City = state ? classifyCityText(text, state) : undefined``
    if (undefined === state) {
        const stateCity = country ? classifyStateCityText(text, country) : undefined
        state = (stateCity ?? {}).state
        city = (stateCity ?? {}).city
    }
    return country
        ? {
            country,
            state,
            city,
        }
        : undefined
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