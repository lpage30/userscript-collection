import countrystatecitymap from './generated_country_state_city_map.json'
import { Country, State, City, CountryStateCityMapType } from './datatypes'

function toNameRegex(name: string): RegExp {
    return new RegExp(`^([,\\s]*|.*[,\\s]+)${name}([,\\s]*|[,\\s]+.*)$`,'ig')
}
export function isMatch(text: string, data: Country | State | City): boolean {
    return (undefined !== data.name && toNameRegex(data.name).test(text)) || 
    (undefined !== data['isoCode'] && toNameRegex(data['isoCode']).test(text))
}

export const CountryStateCityMap = Object.freeze(countrystatecitymap as CountryStateCityMapType)