import Path from 'path'

import {
    outputDataFilesDirname,

    CountryStateCityMapJsonFilename,
    CountryStateCityMapGeocodedJsonFilename,
    toGeojsonIndexFilenamePrefix,
    geojsonIndexFilenameSuffix,
    toGeojsonIndexFilename,
    geocodedCountryMapPrefix,
    countryMapSuffix,
    toCountryMapFilename,
    toGeocodedCountryMapFilename,
    toCountrySymbolname,
} from './names.js'
import { normalizeName } from './functions.js'

export const CountryDataOutput = (countryDataInput) => {
    return {
        geocodingDirpath: countryDataInput.geocodingDirpath,
        outputDirpath: Path.join(countryDataInput.geocodingDirpath, outputDataFilesDirname),
        mapJsonFilepath: Path.join(countryDataInput.geocodingDirpath, outputDataFilesDirname, CountryStateCityMapJsonFilename),
        mapGeocodedJsonFilepath: Path.join(countryDataInput.geocodingDirpath, outputDataFilesDirname, CountryStateCityMapGeocodedJsonFilename),
        geocodedCountryMapParts: {
            prefix: geocodedCountryMapPrefix,
            suffix: countryMapSuffix,
        },
        toSymbolName: toCountrySymbolname,
        toCountryFilepath: (countryName) => Path.join(countryDataInput.geocodingDirpath, outputDataFilesDirname, toCountryMapFilename(countryName)),
        toGeocodedCountryFilepath: (countryName) => Path.join(countryDataInput.geocodingDirpath, outputDataFilesDirname, toGeocodedCountryMapFilename(countryName)),
    }
}

export const GeoDataOutput = (geoDataInput) => ({
    datasourceName: geoDataInput.datasourceName,
    geojsonOutputDirpath: Path.join(geoDataInput.geocodingDirpath, outputDataFilesDirname),
    geojsonIndexFilenameParts: {
        prefix: toGeojsonIndexFilenamePrefix(geoDataInput.datasourceName),
        suffix: geojsonIndexFilenameSuffix
    },
    toGeojsonIndexFilepath: (index) => Path.join(geoDataInput.geocodingDirpath, outputDataFilesDirname, toGeojsonIndexFilename(geoDataInput.datasourceName, index))
})

export const TypescriptDataOutput = (geocodingDirpath) => {
    return {
        toCountryMapFilepath: (usageName) => Path.join(geocodingDirpath, `generated_${usageName}_country_state_city_map.ts`),
        toGeocodedCountryMapFilepath: (usageName) => Path.join(geocodingDirpath, `generated_geocoded_${usageName}_country_state_city_map.ts`),
        toGeoDataFilepath: (usageName, datasourceName) => Path.join(geocodingDirpath, `generated_${usageName}_${datasourceName}.ts`),
        toImportPath: (filepath) => `./${filepath.replace(geocodingDirpath, '')}`,
        countryMapRegisterFunctionsFilepath: Path.join(geocodingDirpath, 'generated_registered_country_state_city_map_functions.ts'),
        geodataRegisterFunctionsFilepath: Path.join(geocodingDirpath, 'generated_registered_geojson_data_functions.ts'),
    }
}