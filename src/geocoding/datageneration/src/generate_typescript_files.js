import fs from 'fs'
import Path from 'path'
import { GeoDataOutput, CountryDataOutput } from './DataOutput.js'
import { durationToString, sortFilterIndexes } from './functions.js'

import {
    CountryStateCityMapGenerator,
    getRequiredGeojsonIndexes,
} from './countrystatecitymap_generator.js'


const CountryStateCityTypescriptGenerator = (
    typescriptDataOutput,
    baseCountryInfoArray,
    geocodedCountryInfoArray,
) => {
    const generateBase = async (countryInfoArray, usageName, indent) => {
        const tstart = Date.now()
        const outputFilepath = typescriptDataOutput.toCountryMapFilepath(usageName)
        console.log(`${indent}Generating ${countryInfoArray.length} base country json exports, getCountries(): Country[], and getCountry(countryName: string): Country exports to ${Path.basename(outputFilepath)} `)
        const { names, globImportLines } = countryInfoArray
            .map(({ name, filepath }) => ([
                `"${name}"`,
                `        case "${name}": return (await Object.values(import.meta.glob('${typescriptDataOutput.toImportPath(filepath)}', { query: '?raw', import: 'default' }))[0]()) as string`
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
        default: throw new Error(\`Country \$\{countryName\} does not exist in ${Path.basename(outputFilepath)}\`)
    }
}
`
        await fs.promises.writeFile(outputFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    const generateGeocoded = async (countryInfoArray, usageName, indent) => {
        const tstart = Date.now()
        const outputFilepath = typescriptDataOutput.toGeocodedCountryMapFilepath(usageName)

        console.log(`${indent}Generating ${countryInfoArray.length} geocoded country json exports, getCountries(): Country[], and getCountry(countryName: string): Country exports to ${Path.basename(outputFilepath)} `)
        const globImportLines = countryInfoArray
            .map(({ name, filepath, country }) =>
                `        case "${name}": return (await Object.values(import.meta.glob('${typescriptDataOutput.toImportPath(filepath)}', { query: '?raw', import: 'default' }))[0]()) as string`
            )
        const typescript = `
import { GeocodedCountry, GeneratedGeocodedCountry, joinBaseAndGeocoded } from './geocodedcountrystatecitytypes'
import { getGeocodedCountryExtension, setGeocodedCountryExtension } from './indexed_db_geocoded_country_state_city_map'
import { getCountry, getCountries } from './${Path.basename(typescriptDataOutput.toCountryMapFilepath(usageName))}'

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
        default: throw new Error(\`\$\{countryName\}] does not exist in ${Path.basename(outputFilepath)}\`)
    }
}
`
        await fs.promises.writeFile(outputFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    const generateRegisterFunctions = async (indent) => {
        const tstart = Date.now()
        const outputFilepath = typescriptDataOutput.countryMapRegisterFunctionsFilepath
        console.log(`${indent}Generating ${Path.basename(outputFilepath)} used to register and call registered getCountries() or getCountry() functions`)
        const geojsonTypescript = `import { Country } from './countrystatecitytypes'
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
        await fs.promises.writeFile(outputFilepath, geojsonTypescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    const generate = async (countryNameArrayFilter, usageName, indent) => {
        const tstart = Date.now()
        console.log(`${indent}Generating Base and Geocoded Country/State/City files for ${usageName} use`)
        await generateBase(
            baseCountryInfoArray.filter(({ name }) => countryNameArrayFilter.includes(name)),
            usageName,
            `${indent}\t`,
        )
        await generateGeocoded(
            geocodedCountryInfoArray.filter(({ name }) => countryNameArrayFilter.includes(name)),
            usageName,
            `${indent}\t`
        )
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    return {
        generate,
        generateRegisterFunctions
    }
}
const GeodataTypescriptGenerator = (
    geoDataInputs,
    typescriptDataOutput,
    geocodedCountryInfoArray,
) => {
    const generateIndex = async (geoDataInput, usageName, indexes, indent) => {
        const tstart = Date.now()
        const geoDataOutput = GeoDataOutput(geoDataInput)
        const outputFilepath = typescriptDataOutput.toGeoDataFilepath(usageName, geoDataInput.datasourceName)
        console.log(`${indent}Generating ${indexes.length} ${geoDataInput.datasourceName} geojson index dynamic imports, get${geoDataInput.datasourceSymbolName}GeojsonIndex(index: number): any exports to ${Path.basename(outputFilepath)}`)
        const indexSwitchCaseGlobLines = indexes.map(index => {
            const indexFilepath = geoDataOutput.toGeojsonIndexFilepath(index)
            return `        case ${index}: return (await Object.values(import.meta.glob('${typescriptDataOutput.toImportPath(indexFilepath)}', { query: '?raw', import: 'default' }))[0]()) as string`
        })
        const typescript = `// ${indexSwitchCaseGlobLines.length} ${geoDataInput.datasourceName} indexes
import { GeojsonIndex } from './datatypes'
import { getGeoJsonIndex, setGeoJsonIndex } from './indexed_db_geojsonindexes'

export async function get${geoDataInput.datasourceSymbolName}GeojsonIndexes(indexes: number[]): Promise<GeojsonIndex[]> {
    const result: GeojsonIndex[] = []
    for(const index of indexes) {
        result.push(await get${geoDataInput.datasourceSymbolName}GeojsonIndex(index))
    }
    return result
}


export async function get${geoDataInput.datasourceSymbolName}GeojsonIndex(index: number): Promise<GeojsonIndex> {
    let result = await getGeoJsonIndex('${geoDataInput.datasourceName}', index)
    if (undefined === result) {
        const resultString = await dynamicLoadGeojsonIndexString(index)
        await setGeoJsonIndex('${geoDataInput.datasourceName}', index, resultString)
        result = JSON.parse(resultString)
    }
    return result
}

async function dynamicLoadGeojsonIndexString(index: number): Promise<string> {
    switch(index) {
${indexSwitchCaseGlobLines.join('\n')}
        default: throw new Error(\`${geoDataInput.datasourceSymbolName}Map[\$\{index\}] does not exist in ${Path.basename(outputFilepath)}\`)
    }
}
`
        await fs.promises.writeFile(outputFilepath, typescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    const generateRegisterFunctions = async (indent = '') => {
        const tstart = Date.now()
        const outputFilepath = typescriptDataOutput.geodataRegisterFunctionsFilepath
        console.log(`${indent}Generating ${Path.basename(outputFilepath)} used to register and call registered ${geoDataInputs.length} get<datasourceSymbolName>GeoJsonIndex() functions`)
        const exports = geoDataInputs.map(geoDataInput => {
            return `
// import get${geoDataInput.datasourceSymbolName}GeojsonIndexes from a generated_<usage>_${geoDataInput.datasourceName}.ts file
// and call registerGet${geoDataInput.datasourceSymbolName}GeojsonIndexes with it.
let fGet${geoDataInput.datasourceSymbolName}GeojsonIndexes: ((indexex: number[]) => Promise<GeojsonIndex[]>) | undefined = undefined

export const registerGet${geoDataInput.datasourceSymbolName}GeojsonIndexes = (func: (indexex: number[]) => Promise<GeojsonIndex[]>): void => { 
    fGet${geoDataInput.datasourceSymbolName}GeojsonIndexes = func 
}

export const get${geoDataInput.datasourceSymbolName}GeojsonIndexes = (indexes: number[]): Promise<GeojsonIndex[]> => {
    if(undefined === fGet${geoDataInput.datasourceSymbolName}GeojsonIndexes) {
        throw new Error('fGet${geoDataInput.datasourceSymbolName}GeojsonIndexes not set. Call registerGet${geoDataInput.datasourceSymbolName}GeojsonIndexes() with get${geoDataInput.datasourceSymbolName}GeojsonIndexes from generated_<usage>_${geoDataInput.datasourceName}.ts')
    }
    return fGet${geoDataInput.datasourceSymbolName}GeojsonIndexes(indexes)
}

// import get${geoDataInput.datasourceSymbolName}GeojsonIndex from a generated_<usage>_${geoDataInput.datasourceName}.ts file
// and call registerGet${geoDataInput.datasourceSymbolName}GeojsonIndex with it.
let fGet${geoDataInput.datasourceSymbolName}GeojsonIndex: ((index: number) => Promise<GeojsonIndex>) | undefined = undefined

export const registerGet${geoDataInput.datasourceSymbolName}GeojsonIndex = (func: (index: number) => Promise<GeojsonIndex>): void => { 
    fGet${geoDataInput.datasourceSymbolName}GeojsonIndex = func 
}

export const get${geoDataInput.datasourceSymbolName}GeojsonIndex = (index: number): Promise<GeojsonIndex> => {
    if(undefined === fGet${geoDataInput.datasourceSymbolName}GeojsonIndex) {
        throw new Error('fGet${geoDataInput.datasourceSymbolName}GeojsonIndex not set. Call registerGet${geoDataInput.datasourceSymbolName}GeojsonIndex() with get${geoDataInput.datasourceSymbolName}GeojsonIndex from generated_<usage>_${geoDataInput.datasourceName}.ts')
    }
    return fGet${geoDataInput.datasourceSymbolName}GeojsonIndex(index)
}
`       })
        const geojsonTypescript = `// register ${geoDataInputs.length} get<datasourceSymbolName>GeoJsonIndex() functions
import { GeojsonIndex } from './datatypes'

${exports.join('\n')}
`
        await fs.promises.writeFile(outputFilepath, geojsonTypescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    const generate = async (countryNameArrayFilter, usageName, indent) => {
        const tstart = Date.now()
        console.log(`${indent}Generating Geojson Index files for ${usageName} use`)
        const usageGeojsonDataGeocoding = geocodedCountryInfoArray
            .filter(({ name }) => countryNameArrayFilter.includes(name))
            .reduce((result, { country }) => Object.keys(country.geocoding)
                .reduce((subresult, datasourceName) => {
                    const indexes = getRequiredGeojsonIndexes(country, datasourceName)
                    if (undefined === subresult[datasourceName]) {
                        subresult[datasourceName] = []
                    }
                    subresult[datasourceName] = sortFilterIndexes([
                        ...subresult[datasourceName],
                        ...indexes
                    ])
                    return subresult
                }, result)
                , {})
        for (const [datasourceName, indexes] of Object.entries(usageGeojsonDataGeocoding)) {
            const geoDataInput = geoDataInputs.find(input => input.datasourceName === datasourceName)
            await generateIndex(geoDataInput, usageName, indexes, `${indent}\t`)
        }
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    return {
        generate,
        generateRegisterFunctions
    }
}

export async function generateTypescriptfiles(typescriptDataOutput, countryDataInput, geoDataInputs, indent) {
    const tstart = Date.now()
    const countryDataOutput = CountryDataOutput(countryDataInput)
    const geoDataOutputs = geoDataInputs.map(GeoDataOutput)

    console.log(`${indent}Generating Typescript files for usages of Country and Geojson files: [${['all', ...Object.keys(countryDataInput.usageCountryMap)].join(',')}]`)
    const countryStateCityGenerator = CountryStateCityMapGenerator(countryDataInput)

    const usedDatasourceNames = []
    const baseCountryInfoArray = Object.values(await countryStateCityGenerator.loadBaseMap(`${indent}\t`))
        .map(country => {
            return {
                name: country.name,
                symbolname: countryDataOutput.toSymbolName(country.name),
                filepath: countryDataOutput.toCountryFilepath(country.name),
                country: country
            }
        })
    const geocodedCountryInfoArray = Object.values(await countryStateCityGenerator.loadGeocodedMap(`${indent}\t`))
        .map(country => {
            Object.keys(country.geocoding)
                .forEach(datasourceName => usedDatasourceNames.push(datasourceName))
            return {
                name: country.name,
                symbolname: countryDataOutput.toSymbolName(country.name),
                filepath: countryDataOutput.toGeocodedCountryFilepath(country.name),
                country: country
            }
        })
    const countryStateCityTypescriptGenerator = CountryStateCityTypescriptGenerator(
        typescriptDataOutput,
        baseCountryInfoArray,
        geocodedCountryInfoArray,
    )
    const geodataTypescriptGenerator = GeodataTypescriptGenerator(
        geoDataInputs,
        typescriptDataOutput,
        geocodedCountryInfoArray,
    )

    for (const [usageName, countryNameArray] of [
        ['all', baseCountryInfoArray.map(({ name }) => name)],
        ...Object.entries(countryDataInput.usageCountryMap)]) {
        await countryStateCityTypescriptGenerator.generate(countryNameArray, usageName, `${indent}\t`)
        await geodataTypescriptGenerator.generate(countryNameArray, usageName, `${indent}\t`)
    }
    await countryStateCityTypescriptGenerator.generateRegisterFunctions(`${indent}\t`)
    await geodataTypescriptGenerator.generateRegisterFunctions(`${indent}\t`)

    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

