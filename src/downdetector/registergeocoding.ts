import { getCountries, getCountry } from '../geocoding/generated_geocoded_all_country_state_city_map'
import { registerGetCountriesAndCountry } from '../geocoding/generated_registered_geocoded_country_state_city_map'

registerGetCountriesAndCountry(getCountries, getCountry)