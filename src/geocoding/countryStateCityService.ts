import { CountryStateCityMap, isMatch } from './CountryStateCityMap'
import { Country, State, City, CountryStateCity } from './datatypes'

export function classifyCountry(text: string): Country | undefined {
    return Object.values(CountryStateCityMap).find(data => isMatch(text, data))
}

export function classifyState(text: string, country: Country): State | undefined {
    return Object.values(country.states).find(data => isMatch(text, data))
}
export function classifyCity(text: string, state: State): City | undefined {
    return Object.values(state.cities).find(data => isMatch(text, data))
}

export function classifyStateCity(text: string, country: Country): { state: State, city: City } | undefined {
    let city: City = undefined
    const state: State = Object.values(country.states).find(state => {
        city = classifyCity(text, state)
        return city !== undefined
    })
    return state ? { state, city } : undefined
}

export function classifyCountryStateCity(text: string): CountryStateCity | undefined {
    const country: Country = classifyCountry(text)
    let state: State = country ? classifyState(text, country) : undefined
    let city: City = state ? classifyCity(text, state) : undefined``
    if (undefined === state) {
        const stateCity = country ? classifyStateCity(text, country) : undefined
        state = (stateCity ?? {}).state
        city = (stateCity ?? {}).city
    }
    return country ? {country, state, city} : undefined
}
export interface ComparableTextCountryStateCity {
    text?: string
    location?: CountryStateCity
}

export function compareFunction(l: ComparableTextCountryStateCity, r: ComparableTextCountryStateCity, compareTextonNoLocation: boolean = true): number {
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