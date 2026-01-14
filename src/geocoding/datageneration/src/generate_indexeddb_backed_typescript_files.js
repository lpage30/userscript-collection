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

    generateBase: async function generateBaseCountryStateCityTSFile(baseCountryInfoArray, tsFilepath, indent) {
        const tstart = Date.now()
        console.log(`${indent}Generating ${baseCountryInfoArray.length} base country json exports, getCountries(): Country[], and getCountry(countryName: string): Country exports to ${Path.basename(tsFilepath)} `)
        const { names, globImportLines } = baseCountryInfoArray
            .map(({ name, filename }) => ([
                `"${name}"`,
                `        case "${name}": return (await Object.values(import.meta.glob('./${GeocodedCountryCityStateDataDirname}/${filename}', { query: '?raw', import: 'default' }))[0]()) as string`
            ]))
            .reduce((result, [name, globImportLine]) => ({
                names: [...result.names, name],
                globImportLines: [...result.globImportLines, globImportLine],
            }), { names: [], globImportLines: [] })
        const typescript = `
import { Country } from './countrystatecitytypes'
import { getCountry as _getCountry, setCountry } from './indexed_db_country_state_city_map'

const countryNames: string[] = [
${names.join(',\n')}
]

export async function getCountries(): Promise<Country[]> {
    const result: Country[] = []
    for(const name of countryNames) {
        const country = await getCountry(name)
        if (undefined === country) {
            throw new Error(\`Country \$\{name\} was not found\`)
        }
        result.push(country)
    }
    return result
}

export async function getCountry(countryName: string): Promise<Country | undefined> {
    let country = await _getCountry(countryName)
    if (undefined === country) {
        const countryString = await dynamicLoadCountryString(countryName)
        if (undefined !== countryString) {
            setCountry(countryName, countryString)
        }
        country = JSON.parse(countryString)
    }
    return country
}
async function dynamicLoadCountryString(countryName: string): Promise<string> {
    switch(countryName) {
${globImportLines.join('\n')}
        default: throw new Error(\`Country \$\{countryName\} does not exist in ${Path.basename(tsFilepath)}\`)
    }
}
`
        await fs.promises.writeFile(tsFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    },
    generateGeocoded: async function generateGeocodedCountryStateCityTSFile(geocodedCountryInfoArray, baseTsFilepath, tsFilepath, indent, asMap) {
        const tstart = Date.now()
        console.log(`${indent}Generating ${geocodedCountryInfoArray.length} geocoded country json exports, getCountries(): Country[], and getCountry(countryName: string): Country exports to ${Path.basename(tsFilepath)} `)
        const globImportLines = geocodedCountryInfoArray
            .map(({ name, filename, country }) =>
                `        case "${name}": return (await Object.values(import.meta.glob('./${GeocodedCountryCityStateDataDirname}/${filename}', { query: '?raw', import: 'default' }))[0]()) as string`
            )
        const typescript = `
import { GeocodedCountry, GeneratedGeocodedCountry, joinBaseAndGeocoded } from './geocodedcountrystatecitytypes'
import { getGeocodedCountryExtension, setGeocodedCountryExtension } from './indexed_db_geocoded_country_state_city_map'
import { getCountry, getCountries } from './${Path.basename(baseTsFilepath)}'

export async function getGeocodedCountries(): Promise<GeocodedCountry[]> {
    const countryBases = await getCountries()
    const result: GeocodedCountry[] = []
    for(let i = 0; i < countryBases.length; i += 1) {
        const countryExtension = await getCountryExtension(countryBases[i].name)
        if (undefined === countryExtension) {
            throw new Error(\`CountryExtension \$\{name\} was not found\`)
        }

        result.push(joinBaseAndGeocoded(countryBases[i], countryExtension))
    }
    return result
}

export async function getGeocodedCountry(countryName: string): Promise<GeocodedCountry | undefined> {
    const countryBase = await getCountry(countryName)
    if (undefined === countryBase) {
        return undefined
    }
    const countryExtension = await getCountryExtension(countryName)
    if (undefined === countryExtension) {
            return undefined
    }
    return joinBaseAndGeocoded(countryBase, countryExtension)
}

async function getCountryExtension(countryName: string): Promise<GeneratedGeocodedCountry | undefined> {
    let countryExtension = await getGeocodedCountryExtension(countryName)
    if (undefined === countryExtension) {
        const countryExtensionString = await dynamicLoadCountryGeocodedExtensionString(countryName)
        if (undefined !== countryExtensionString) {
            setGeocodedCountryExtension(countryName, countryExtensionString)
        }
        countryExtension = JSON.parse(countryExtensionString)
    }
    return countryExtension
}

async function dynamicLoadCountryGeocodedExtensionString(countryName: string): Promise<string> {
    switch(countryName) {
${globImportLines.join('\n')}
        default: throw new Error(\`\$\{countryName\}] does not exist in ${Path.basename(tsFilepath)}\`)
    }
}
`
        await fs.promises.writeFile(tsFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    },
    generateRegisterFunctions: async function generateRegisterGetCountriesTSFile(tsFilepath, indent) {
        const tstart = Date.now()
        console.log(`${indent}Generating ${Path.basename(tsFilepath)} used to register and call registered getCountries() or getCountry() functions`)
        const geojsonTypescript = `import { Country, CountryStateBase} from './countrystatecitytypes'
import { GeocodedCountry } from './geocodedcountrystatecitytypes'    

// import getCountries from a generated_<usage>_country_state_city_map.ts
let fGetCountries: (() => Promise<Country[]>) | undefined = undefined
export const registerGetCountries = (getCountriesFunc: () => Promise<Country[]>) => {
    fGetCountries = getCountriesFunc
}
export function getCountries(): Promise<Country[]> {
    if(undefined === fGetCountries) {
        throw new Error('fGetCountries not set. Call registerGetCountries() with imported, generated getCountries func')
    }
    return fGetCountries()
}

// import getCountry from a generated_<usage>_country_state_city_map.ts file
let fGetCountry: ((countryName: string) => Promise<Country | undefined>) | undefined = undefined
export const registerGetCountry = (getCountryFunc: (countryName: string) => Promise<Country| undefined>) => {
    fGetCountry = getCountryFunc
}
export function getCountry(countryName: string): Promise<Country | undefined> {
    if(undefined === fGetCountry) {
        throw new Error('fGetCountry not set. Call registerGetCountry() with imported, generated getCountry func')
    }
    return fGetCountry(countryName)
}

// import getGeocodedCountries from a generated_geocoded_<usage>_country_state_city_map.ts
let fGetGeocodedCountries: (() => Promise<GeocodedCountry[]>) | undefined = undefined
export const registerGetGeocodedCountries = (getGeocodedCountriesFunc: () => Promise<GeocodedCountry[]>) => {
    fGetGeocodedCountries = getGeocodedCountriesFunc
}
export function getGeocodedCountries(): Promise<GeocodedCountry[]> {
    if(undefined === fGetGeocodedCountries) {
        throw new Error('fGetGeocodedCountries not set. Call registerGetGeocodedCountries() with imported, generated getGeocodedCountries func')
    }
    return fGetGeocodedCountries()
}


// import getGeocodedCountry from a generated_geocoded_<usage>_country_state_city_map.ts file
let fGetGeocodedCountry: ((countryName: string) => Promise<GeocodedCountry | undefined>) | undefined = undefined
export const registerGetGeocodedCountry = (getGeocodedCountryFunc: (countryName: string) => Promise<GeocodedCountry | undefined>) => {
    fGetGeocodedCountry = getGeocodedCountryFunc
}
export async function getGeocodedCountry(countryName: string): Promise<GeocodedCountry | undefined> {
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
            return `        case ${index}: return (await Object.values(import.meta.glob('./${GeojsonDataDirname}/${geojsonindexName}.json', { query: '?raw', import: 'default' }))[0]()) as string`
        })
        const typescript = `// ${indexSwitchCaseGlobLines.length} ${geojsonFilenamePrefix} indexes
import { GeojsonIndex } from './datatypes'
import { getGeoJsonIndex, setGeoJsonIndex } from './indexed_db_geojsonindexes'

export async function get${geodataName}GeojsonIndexes(indexes: number[]): Promise<GeojsonIndex[]> {
    const result: GeojsonIndex[] = []
    for(const index of indexes) {
        result.push(await get${geodataName}GeojsonIndex(index))
    }
    return result
}


export async function get${geodataName}GeojsonIndex(index: number): Promise<GeojsonIndex> {
    let result = await getGeoJsonIndex('${geojsonFilenamePrefix}', index)
    if (undefined === result) {
        const resultString = await dynamicLoadGeojsonIndexString(index)
        await setGeoJsonIndex('${geojsonFilenamePrefix}', index, resultString)
        result = JSON.parse(resultString)
    }
    return result
}

async function dynamicLoadGeojsonIndexString(index: number): Promise<string> {
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
// import get${geodataName}GeojsonIndexes from a generated_<usage>_${geojsonFilenamePrefix}.ts file
// and call registerGet${geodataName}GeojsonIndexes with it.
let fGet${geodataName}GeojsonIndexes: ((indexex: number[]) => Promise<GeojsonIndex[]>) | undefined = undefined

export const registerGet${geodataName}GeojsonIndexex = (func: (indexex: number[]) => Promise<GeojsonIndex[]>): void => { 
    fGet${geodataName}GeojsonIndexex = func 
}

export const get${geodataName}GeojsonIndexes = (indexes: number[]): Promise<GeojsonIndex> => {
    if(undefined === fGet${geodataName}GeojsonIndexes) {
        throw new Error('fGet${geodataName}GeojsonIndexes not set. Call registerGet${geodataName}GeojsonIndexes() with get${geodataName}GeojsonIndexes from generated_<usage>_${geojsonFilenamePrefix}.ts')
    }
    return fGet${geodataName}GeojsonIndexes(indexes)
}

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

export async function generateTSfiles(geocodingDirname, usageCountryMap, indent, asMap) {
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

