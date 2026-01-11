import { getCountryNameIsoCodes, getCountry } from '../geocoding/generated_geocoded_country_state_city_map'
import { registerGetCountryNameIsoCodesAndCountry } from '../geocoding/generated_registered_geocoded_country_state_city_map'

registerGetCountryNameIsoCodesAndCountry(getCountryNameIsoCodes, getCountry)