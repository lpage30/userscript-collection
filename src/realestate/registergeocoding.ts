import { getCountries, getCountry } from '../geocoding/generated_realestate_country_state_city_map'
import { getGeocodedCountries, getGeocodedCountry } from '../geocoding/generated_geocoded_realestate_country_state_city_map'
import { getTl2025UsCoastlineGeojsonIndex } from '../geocoding/generated_realestate_tl_2025_us_coastline'
import { getUkcp18UkMarineCoastlineHiresGeojsonIndex } from '../geocoding/generated_realestate_ukcp18_uk_marine_coastline_hires'

import { registerGetCountry, registerGetCountries, registerGetGeocodedCountries, registerGetGeocodedCountry } from '../geocoding/generated_registered_country_state_city_map_functions'
import { registerGetTl2025UsCoastlineGeojsonIndex, registerGetUkcp18UkMarineCoastlineHiresGeojsonIndex } from '../geocoding/generated_registered_geojson_data_functions'

registerGetCountries(getCountries)
registerGetCountry(getCountry)

registerGetGeocodedCountries(getGeocodedCountries)
registerGetGeocodedCountry(getGeocodedCountry)

registerGetTl2025UsCoastlineGeojsonIndex(getTl2025UsCoastlineGeojsonIndex)
registerGetUkcp18UkMarineCoastlineHiresGeojsonIndex(getUkcp18UkMarineCoastlineHiresGeojsonIndex)