import fs from 'fs'
import Path from 'path'
import { durationToString, normalizeName, toTitleCase, sortFilterIndexes } from './functions.js'
import {
    CountryStateCityMapGenerator,
    GeocodedCountryCityStateDataDirname,
    getRequiredGeojsonIndexes,
    CountryStateCityMapJsonFilename,
    CountryStateCityMapGeocodedJsonFilename
} from './countrystatecitymap_generator.js'
import { GeojsonDataDirname } from './geocode_generator.js'

const CountryStateCityTSGenerators = {

    generateBase: async function generateBaseCountryStateCityTSFile(baseCountryInfoArray, tsFilepath, indent, asMap) {
        const tstart = Date.now()
        console.log(`${indent}Generating ${baseCountryInfoArray.length} base country json exports, getCountries(): Country[], and getCountry(countryName: string): Country exports to ${Path.basename(tsFilepath)} `)
        let typescript = `// ${baseCountryInfoArray.length} ${asMap ? 'imported country map' : 'dynamic imported countries'}`
        if (asMap) {
            const countryMappingLines = baseCountryInfoArray.map(({ name, country }) =>
                `    ["${name}"]: ${JSON.stringify(country)}`
            )
            typescript = `${typescript}
import { Country, CountryStateBase } from './countrystatecitytypes'

export const getCountryBaseInfo = (): CountryStateBase[] => Object.values(CountryStateCityMap).map(country => country as CountryStateBase)
export const getCountry = (countryName: string): Country | undefined => CountryStateCityMap[countryName]

const CountryStateCityMap: { [countryName: string]: Country } = {
${countryMappingLines.join(',\n')}
}

`
        } else {
            const { infoArrayLines, globImportLines } = baseCountryInfoArray
                .map(({ name, filename, country }) => ([
                    `    { name: "${name}", isoCode: "${country.isoCode}", lat: ${country.lat}, lon: ${country.lon}, containedCoordinates: [${country.containedCoordinates.map(JSON.stringify).join(',')}] }`,
                    `        case "${name}": return (await Object.values(import.meta.glob('./${GeocodedCountryCityStateDataDirname}/${filename}', { import: 'default' }))[0]()) as Country`
                ]))
                .reduce((result, [infoArrayLine, globImportLine]) => ({
                    infoArrayLines: [...result.infoArrayLines, infoArrayLine],
                    globImportLines: [...result.globImportLines, globImportLine],
                }), { infoArrayLines: [], globImportLines: [] })
            typescript = `${typescript}
import { Country, CountryStateBase} from './countrystatecitytypes'

export const getCountryBaseInfo = (): CountryStateBase[] => CountryBaseInfoArray

export async function getCountry(countryName: string): Promise<Country> { 
    if (undefined === CountryStateCityMap[countryName]) {
        CountryStateCityMap[countryName] = await dynamicLoadCountryMap(countryName)
    }
    return CountryStateCityMap[countryName]
}

const CountryStateCityMap: { [country: string]: Country } = {}

const CountryBaseInfoArray: CountryStateBase[] = [
${infoArrayLines.join(',\n')}
]
async function dynamicLoadCountryMap(countryName: string): Promise<Country> {
    switch(countryName) {
${globImportLines.join('\n')}
        default: throw new Error(\`CountryMap[\$\{countryName\}] does not exist in ${Path.basename(tsFilepath)}\`)
    }
}
`
        }
        await fs.promises.writeFile(tsFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    },
    generateGeocoded: async function generateGeocodedCountryStateCityTSFile(geocodedCountryInfoArray, baseTsFilepath, tsFilepath, indent, asMap) {
        const tstart = Date.now()
        console.log(`${indent}Generating ${geocodedCountryInfoArray.length} geocoded country json exports, getCountries(): Country[], and getCountry(countryName: string): Country exports to ${Path.basename(tsFilepath)} `)
        let typescript = `// ${geocodedCountryInfoArray.length} ${asMap ? 'imported country map' : 'dynamic imported countries'}`
        if (asMap) {
            const countryMappingLines = geocodedCountryInfoArray.map(({ name, country }) =>
                `    ["${name}"]: ${JSON.stringify(country)}`
            )
            typescript = `${typescript}
import { GeocodedCountry, GeneratedGeocodedCountry, joinBaseAndGeocoded } from './geocodedcountrystatecitytypes'
import { getCountryBaseInfo as _getCountryBaseInfo, getCountry as _getCountry } from './${Path.basename(baseTsFilepath)}'

export const getCountryBaseInfo = _getCountryBaseInfo
export const getGeocodedCountry = (countryName: string): GeocodedCountry | undefined => {
    const geocodedCountryExtension = CountryStateCityGeocodedExtensionsMap[countryName]
    const countryBase = _getCountry(countryName)
    
    return [undefined, null].some(v => [geocodedCountryExtension, countryBase].includes(v))
        ? undefined
        : joinBaseAndGeocoded(countryBase, geocodedCountryExtension)
}

const CountryStateCityGeocodedExtensionsMap: { [countryName: string]: GeneratedGeocodedCountry } = {
${countryMappingLines.join(',\n')}
}
`
        } else {
            const globImportLines = geocodedCountryInfoArray
                .map(({ name, filename, country }) =>
                    `        case "${name}": return (await Object.values(import.meta.glob('./${GeocodedCountryCityStateDataDirname}/${filename}', { import: 'default' }))[0]()) as GeneratedGeocodedCountry`
                )
            typescript = `${typescript}
import { GeocodedCountry, GeneratedGeocodedCountry, joinBaseAndGeocoded } from './geocodedcountrystatecitytypes'
import { getCountryBaseInfo as _getCountryBaseInfo, getCountry as _getCountry } from './${Path.basename(baseTsFilepath)}'

export const getCountryBaseInfo = _getCountryBaseInfo
export async function getGeocodedCountry(countryName: string): Promise<GeocodedCountry> {            
    if (undefined === CountryStateCityGeocodedExtensionsMap[countryName]) {
        CountryStateCityGeocodedExtensionsMap[countryName] = await dynamicLoadCountryGeocodedExtension(countryName)
    }

    const geocodedCountryExtension = CountryStateCityGeocodedExtensionsMap[countryName]
    const countryBase = await _getCountry(countryName)
    return [undefined, null].some(v => [geocodedCountryExtension, countryBase].includes(v))
        ? undefined
        : joinBaseAndGeocoded(countryBase, geocodedCountryExtension)
}
const CountryStateCityGeocodedExtensionsMap: { [country: string]: GeneratedGeocodedCountry } = {}

async function dynamicLoadCountryGeocodedExtension(countryName: string): Promise<GeneratedGeocodedCountry> {
    switch(countryName) {
${globImportLines.join('\n')}
        default: throw new Error(\`CountryMap[\$\{countryName\}] does not exist in ${Path.basename(tsFilepath)}\`)
    }
}
`
        }
        await fs.promises.writeFile(tsFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    },
    generateRegisterFunctions: async function generateRegisterGetCountriesTSFile(tsFilepath, indent, asMap) {
        const tstart = Date.now()
        console.log(`${indent}Generating ${Path.basename(tsFilepath)} used to register and call registered getCountries() or getCountry() functions`)
        const geojsonTypescript = `import { Country, CountryStateBase} from './countrystatecitytypes'
import { GeocodedCountry } from './geocodedcountrystatecitytypes'    

// import getCountryBaseInfo from a generated_<usage>_country_state_city_map.ts or generated_geocoded_<usage>_country_state_city_map.ts file
let fGetCountryBaseInfo: (() => CountryStateBase[]) | undefined = undefined
export const registerGetCountryBaseInfo = (getCountryBaseInfoFunc: () => CountryStateBase[]) => {
    fGetCountryBaseInfo = getCountryBaseInfoFunc
}
export function getCountryBaseInfo(): CountryStateBase[] {
    if(undefined === fGetCountryBaseInfo) {
        throw new Error('fGetCountryBaseInfo not set. Call registerGetCountryBaseInfo() with imported, generated getCountryBaseInfo func')
    }
    return fGetCountryBaseInfo()
}

// import getCountry from a generated_<usage>_country_state_city_map.ts file
let fGetCountry: ((countryName: string) => ${asMap ? 'Country' : 'Promise<Country>'}) | undefined = undefined
export const registerGetCountry = (getCountryFunc: (countryName: string) => ${asMap ? 'Country' : 'Promise<Country>'}) => {
    fGetCountry = getCountryFunc
}
export function getCountry(countryName: string): ${asMap ? 'Country' : 'Promise<Country>'} {
    if(undefined === fGetCountry) {
        throw new Error('fGetCountry not set. Call registerGetCountry() with imported, generated getCountry func')
    }
    return fGetCountry(countryName)
}

// import getGeocodedCountry from a generated_geocoded_<usage>_country_state_city_map.ts file
let fGetGeocodedCountry: ((countryName: string) => ${asMap ? 'GeocodedCountry' : 'Promise<GeocodedCountry>'}) | undefined = undefined
export const registerGetGeocodedCountry = (getGeocodedCountryFunc: (countryName: string) => ${asMap ? 'GeocodedCountry' : 'Promise<GeocodedCountry>'}) => {
    fGetGeocodedCountry = getGeocodedCountryFunc
}
export function getGeocodedCountry(countryName: string): ${asMap ? 'GeocodedCountry' : 'Promise<GeocodedCountry>'} {
    if(undefined === fGetGeocodedCountry) {
        throw new Error('fGetGeocodedCountry not set. Call registerGetGeocodedCountry() with imported, generated getGeocodedCountry func')
    }
    return fGetGeocodedCountry(countryName)
}
`
        await fs.promises.writeFile(tsFilepath, geojsonTypescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    },
}
const GeojsonTSGenerators = {
    generateIndex: async function generateGeojsonDataTSFile(geojsonFilenamePrefix, indexes, tsFilepath, indent = '') {
        const tstart = Date.now()
        const geodataName = toTitleCase(geojsonFilenamePrefix)
        const toGeojsonIndexName = (index) => `${geojsonFilenamePrefix}_${index}`
        console.log(`${indent}Generating ${indexes.length} ${geojsonFilenamePrefix} geojson index dynamic imports, get${geodataName}GeojsonIndex(index: number): any exports to ${Path.basename(tsFilepath)}`)
        const indexSwitchCaseGlobLines = indexes.map(index => {
            const geojsonindexName = toGeojsonIndexName(index)
            return `        case ${index}: return {source: '${geojsonFilenamePrefix}', ...(await Object.values(import.meta.glob('./${GeojsonDataDirname}/${geojsonindexName}.json', { import: 'default' }))[0]()) as GeojsonIndex }`
        })
        const typescript = `// ${indexSwitchCaseGlobLines.length} dynamic imported ${geojsonFilenamePrefix} indexes
import { GeojsonIndex } from './datatypes'

export async function get${geodataName}GeojsonIndex(index: number): Promise<GeojsonIndex> {
    switch(index) {
${indexSwitchCaseGlobLines.join('\n')}
        default: throw new Error(\`${geodataName}Map[\$\{index\}] does not exist in ${Path.basename(tsFilepath)}\`)
    }
}
`
        await fs.promises.writeFile(tsFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    },
    generateRegisterFunctions: async function generateRegisterGetGeojsonIndexTSFile(geojsonFilenamePrefixes, tsFilepath, indent = '') {
        const tstart = Date.now()
        console.log(`${indent}Generating ${Path.basename(tsFilepath)} used to register and call registered ${geojsonFilenamePrefixes.length} get<geoDataName>GeoJsonIndex() functions`)
        const exports = geojsonFilenamePrefixes.map(geojsonFilenamePrefix => {
            const geodataName = toTitleCase(geojsonFilenamePrefix)
            return `
// import get${geodataName}GeojsonIndex from a generated_<usage>_${geojsonFilenamePrefix}.ts file
// and call registerGet${geodataName}GeojsonIndex with it.
let fGet${geodataName}GeojsonIndex: ((index: number) => Promise<GeojsonIndex>) | undefined = undefined

export const registerGet${geodataName}GeojsonIndex = (func: (index: number) => Promise<GeojsonIndex>): void => { 
    fGet${geodataName}GeojsonIndex = func 
}

export const get${geodataName}GeojsonIndex = (index: number): Promise<GeojsonIndex> => {
    if(undefined === fGet${geodataName}GeojsonIndex) {
        throw new Error('fGet${geodataName}GeojsonIndex not set. Call registerGet${geodataName}GeojsonIndex() with get${geodataName}GeojsonIndex from generated_<usage>_${geojsonFilenamePrefix}.ts')
    }
    return fGet${geodataName}GeojsonIndex(index)
}
`   })
        const geojsonTypescript = `// register ${geojsonFilenamePrefixes.length} get<geoDataName>GeoJsonIndex() functions
import { GeojsonIndex } from './datatypes'

${exports.join('\n')}
`
        await fs.promises.writeFile(tsFilepath, geojsonTypescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
}
const toBaseCountryStateCityTsFilepath = (geocodingDirname, usage) =>
    Path.join(geocodingDirname, `generated_${usage}_country_state_city_map.ts`)

const toGeocodedCountryStateCityTsFilepath = (geocodingDirname, usage) =>
    Path.join(geocodingDirname, `generated_geocoded_${usage}_country_state_city_map.ts`)

const toGeojsonDataTsFilepath = (geocodingDirname, geojsonFilenamePrefix, usage) =>
    Path.join(geocodingDirname, `generated_${usage}_${geojsonFilenamePrefix}.ts`)

async function generateCountryStateCityTSFiles(
    geocodingDirname,
    baseCountryInfoArray,
    geocodedCountryInfoArray,
    countryNameArrayFilter,
    usageName,
    indent,
    asMap
) {
    const tstart = Date.now()

    const baseTsFilepath = toBaseCountryStateCityTsFilepath(geocodingDirname, usageName)
    const geocodedTsFilepath = toGeocodedCountryStateCityTsFilepath(geocodingDirname, usageName)
    console.log(`${indent}Generating Base and Geocoded Country/State/City files for ${usageName} use${asMap ? '' : ' with lazy loading (promise)'}`)
    await CountryStateCityTSGenerators.generateBase(
        baseCountryInfoArray.filter(({ name }) => countryNameArrayFilter.includes(name)),
        baseTsFilepath,
        `${indent}\t`,
        asMap
    )
    await CountryStateCityTSGenerators.generateGeocoded(
        geocodedCountryInfoArray.filter(({ name }) => countryNameArrayFilter.includes(name)),
        baseTsFilepath,
        geocodedTsFilepath,
        `${indent}\t`,
        asMap
    )
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}
async function generateGeojsonIndexTSFiles(
    geocodingDirname,
    geocodedCountryInfoArray,
    countryNameArrayFilter,
    usageName,
    indent = '',
) {
    const tstart = Date.now()
    console.log(`${indent}Generating Geojson Index files for ${usageName} use`)
    const usageGeojsonDataGeocoding = geocodedCountryInfoArray
        .filter(({ name }) => countryNameArrayFilter.includes(name))
        .reduce((result, { country }) => Object.keys(country.geocoding)
            .reduce((subresult, dataFilenamePrefix) => {
                const indexes = getRequiredGeojsonIndexes(country, dataFilenamePrefix)
                if (undefined === subresult[dataFilenamePrefix]) {
                    subresult[dataFilenamePrefix] = []
                }
                subresult[dataFilenamePrefix] = sortFilterIndexes([
                    ...subresult[dataFilenamePrefix],
                    ...indexes
                ])
                return subresult
            }, result)
            , {})
    for (const [geojsonFilenamePrefix, indexes] of Object.entries(usageGeojsonDataGeocoding)) {
        const tsFilepath = toGeojsonDataTsFilepath(geocodingDirname, geojsonFilenamePrefix, usageName)
        await GeojsonTSGenerators.generateIndex(geojsonFilenamePrefix, indexes, tsFilepath, `${indent}\t`)
    }
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)

}
async function generateRegisterFunctionsTSFiles(
    geocodingDirname,
    geojsonFilenamePrefixes,
    indent,
    asMap
) {
    const tstart = Date.now()
    console.log(`${indent}Generating Country/state/city and Geojson function registration files`)

    const countryStateCityRegisterFilename = 'generated_registered_country_state_city_map_functions.ts'
    const geojsonDataRegisterFilename = 'generated_registered_geojson_data_functions.ts'
    await CountryStateCityTSGenerators.generateRegisterFunctions(Path.join(geocodingDirname, countryStateCityRegisterFilename), `${indent}\t`, asMap)
    await GeojsonTSGenerators.generateRegisterFunctions(geojsonFilenamePrefixes, Path.join(geocodingDirname, geojsonDataRegisterFilename), `${indent}\t`)
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

export async function generateTSfiles(geocodingDirname, usageCountryMap, indent = '', asMap = false) {
    const tstart = Date.now()
    console.log(`${indent}Generating Country/State/City Map and Geojson Data Typescript files for usages: [${['all', ...Object.keys(usageCountryMap)].join(',')}]`)
    const countryStateCityGenerator = CountryStateCityMapGenerator(geocodingDirname)

    const geojsonFilenamePrefixes = []
    const baseCountryInfoArray = Object.values(await countryStateCityGenerator.loadBaseMap(`${indent}\t`))
        .map(country => {
            const symbolname = normalizeName(country.name).toLowerCase()
            return {
                name: country.name,
                symbolname,
                filename: `${symbolname}.json`,
                country: country
            }
        })
    const geocodedCountryInfoArray = Object.values(await countryStateCityGenerator.loadGeocodedMap(`${indent}\t`))
        .map(country => {
            const symbolname = normalizeName(country.name).toLowerCase()
            Object.keys(country.geocoding)
                .filter(geojsonFilenamePrefix => !geojsonFilenamePrefixes.includes(geojsonFilenamePrefix))
                .forEach(geojsonFilenamePrefix => geojsonFilenamePrefixes.push(geojsonFilenamePrefix))
            return {
                name: country.name,
                symbolname,
                filename: `geocoded_${symbolname}.json`,
                country: country
            }
        })

    for (const [usageName, countryNameArray] of [['all', baseCountryInfoArray.map(({ name }) => name)], ...Object.entries(usageCountryMap)]) {
        await generateCountryStateCityTSFiles(
            geocodingDirname,
            baseCountryInfoArray,
            geocodedCountryInfoArray,
            countryNameArray,
            usageName,
            `${indent}\t`,
            asMap
        )
        await generateGeojsonIndexTSFiles(
            geocodingDirname,
            geocodedCountryInfoArray,
            countryNameArray,
            usageName,
            `${indent}\t`
        )
    }
    await generateRegisterFunctionsTSFiles(
        geocodingDirname,
        geojsonFilenamePrefixes,
        `${indent}\t`,
        asMap
    )
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

