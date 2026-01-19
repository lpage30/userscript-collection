import { normalizeName } from './functions.js'
export const datagenerationDirname = 'datageneration'
export const inputDataFilesDirname = 'geodata'
export const outputDataFilesDirname = 'data_files'
export const CountryStateCityMapJsonFilename = 'country_state_city_map.json'
export const CountryStateCityMapGeocodedJsonFilename = 'geocoded_country_state_city_map.json'

export const USCoastalRegionInputShapeFilename = 'tl_2025_us_coastline.shp'
export const USCoastalRegionDatasourceName = 'tl_2025_us_coastline'

export const UKCoastalRegionInputShapeFilename = 'ukcp18-uk-marine-coastline-hires.shp'
export const UKCoastalRegionDatasourceName = 'ukcp18_uk_marine_coastline_hires'

export const toGeojsonIndexFilenamePrefix = (datasourceName) => `${datasourceName}_`
export const geojsonIndexFilenameSuffix = `.json`
export const toGeojsonIndexFilename = (datasourceName, index) =>
    `${toGeojsonIndexFilenamePrefix(datasourceName)}${index}${geojsonIndexFilenameSuffix}`

export const toCountrySymbolname = (countryName) => normalizeName(countryName).toLowerCase()
export const toCountryNameForFilename = toCountrySymbolname
export const geocodedCountryMapPrefix = 'geocoded_'
export const countryMapSuffix = '.json'

export const toCountryMapFilename = (countryName) => `${toCountryNameForFilename(countryName)}${countryMapSuffix}`
export const toGeocodedCountryMapFilename = countryName => `${geocodedCountryMapPrefix}${toCountryMapFilename(countryName)}`