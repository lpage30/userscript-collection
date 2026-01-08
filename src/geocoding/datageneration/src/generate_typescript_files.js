import fs from 'fs'
import Path from 'path'
import { durationToString, normalizeName, toTitleCase, sortFilterIndexes } from './functions.js'
import { CountryStateCityMapGenerator, GeocodedCountryCityStateDataDirname, getRequiredGeojsonIndexes } from './countrystatecitymap_generator.js'
import { GeojsonDataDirname } from './geocode_generator.js'


async function generateCountryStateCityTSFile(countryInfoArray, tsFilepath, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Generating ${countryInfoArray.length} country json imports, getCountryNames(): string[], and getCountry(countryName: string): Country exports to ${Path.basename(tsFilepath)} `)

    const importLines = countryInfoArray.map(({ name, symbolname, filename }) => `import ${symbolname} from './${GeocodedCountryCityStateDataDirname}/${filename}'`)
    const countryTypescript = `// ${importLines.length} imported countries
${importLines.join('\n')}
import { Country } from './datatypes'

const CountryMap: { [country: string]: Country } = Object.freeze({
${countryInfoArray.map(({ name, symbolname }) => `    ["${name}"]: ${symbolname}`).join(',\n')}
})

export function getCountries(): Country[] { return Object.values(CountryMap)}
export function getCountry(countryName: string): Country { 
    if (undefined === CountryMap[countryName]) {
        throw new Error(\`CountryMap[\$\{countryName\}] does not exist in ${Path.basename(tsFilepath)}\`)
    }
    return CountryMap[countryName]
}
`
    await fs.promises.writeFile(tsFilepath, countryTypescript, 'utf8')
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

async function generateRegisterGetCountriesTSFile(tsFilepath, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Generating ${Path.basename(tsFilepath)} used to register and call registered getCountries() or getCountry() functions`)
    const geojsonTypescript = `import { Country } from './datatypes'

let fGetCountries: (() => Country[]) | undefined = undefined
let fGetCountry: ((countryName: string) => Country) | undefined = undefined

export const registerGetCountriesAndCountry = (getCountriesFunc: () => Country[], getCountryFunc: (countryName: string) => Country): void => {
    fGetCountries = getCountriesFunc
    fGetCountry = getCountryFunc
}

export function getCountries(): Country[] {
    if(undefined === fGetCountries) {
        throw new Error('fGetCountries not set. Call registerGetCountriesAndCountry() with getCountries and getCountry from generated_geocoded_<usage>_country_state_city_map.ts')
    }
    return fGetCountries()
}
export function getCountry(countryName: string): Country { 
    if(undefined === fGetCountry) {
        throw new Error('fGetCountry not set. Call registerGetCountriesAndCountry() with getCountries and getCountry from generated_geocoded_<usage>_country_state_city_map.ts')
    }
    return fGetCountry(countryName)
}
`
    await fs.promises.writeFile(tsFilepath, geojsonTypescript, 'utf8')
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

async function generateGeojsonDataTSFile(geojsonFilenamePrefix, indexes, tsFilepath, indent = '') {
    const tstart = Date.now()
    const geodataName = toTitleCase(geojsonFilenamePrefix)
    const toGeojsonIndexName = (index) => `${geojsonFilenamePrefix}_${index}`
    console.log(`${indent}Generating ${indexes.length} ${geojsonFilenamePrefix} geojson index imports, get${geodataName}GeojsonIndex(index: number): any exports to ${Path.basename(tsFilepath)}`)
    const importLines = indexes.map(index => {
        const geojsonindexName = toGeojsonIndexName(index)
        return `import ${geojsonindexName} from './${GeojsonDataDirname}/${geojsonindexName}.json'`
    })
    const geojsonTypescript = `// ${importLines.length} imported ${geojsonFilenamePrefix} indexes
${importLines.join('\n')}

const ${geodataName}Map: { [index: number]: any } = Object.freeze({
${indexes.map(index => `    [${index}]: ${toGeojsonIndexName(index)}`).join(',\n')}
    })

export function get${geodataName}GeojsonIndex(index: number): any { 
    if (undefined === ${geodataName}Map[index]) {
        throw new Error(\`${geodataName}Map[\$\{index\}] does not exist in ${Path.basename(tsFilepath)}\`)
    }
    return ${geodataName}Map[index] 
}
`
    await fs.promises.writeFile(tsFilepath, geojsonTypescript, 'utf8')
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

async function generateRegisterGetGeojsonIndexTSFile(geojsonFilenamePrefixes, tsFilepath, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Generating ${Path.basename(tsFilepath)} used to register and call registered ${geojsonFilenamePrefixes.length} get<geoDataName>GeoJsonIndex() functions`)
    const exports = geojsonFilenamePrefixes.map(geojsonFilenamePrefix => {
        const geodataName = toTitleCase(geojsonFilenamePrefix)
        return `// import get${geodataName}GeojsonIndex from a generated_<usage>_${geojsonFilenamePrefix}.ts file
// and call registerGet${geodataName}GeojsonIndex with it.

let fGet${geodataName}GeojsonIndex: ((index: number) => any) | undefined = undefined

export const registerGet${geodataName}GeojsonIndex = (func: (index: number) => any): void => { 
    fGet${geodataName}GeojsonIndex = func 
}

export const get${geodataName}GeojsonIndex = (index: number): any => {
    if(undefined === fGet${geodataName}GeojsonIndex) {
        throw new Error('fGet${geodataName}GeojsonIndex not set. Call registerGet${geodataName}GeojsonIndex() with get${geodataName}GeojsonIndex from generated_<usage>_${geojsonFilenamePrefix}.ts')
    }
    return fGet${geodataName}GeojsonIndex(index)
}
`   })
const geojsonTypescript = `// register ${geojsonFilenamePrefixes.length} get<geoDataName>GeoJsonIndex() functions
${exports.join('\n')}
`
await fs.promises.writeFile(tsFilepath, geojsonTypescript, 'utf8')
console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

const toCountryStateCityTsFilepath = (geocodingDirname, usage) =>
    Path.join(geocodingDirname, `generated_geocoded_${usage}_country_state_city_map.ts`)

const toGeojsonDataTsFilepath = (geocodingDirname, geojsonFilenamePrefix, usage) =>
    Path.join(geocodingDirname, `generated_${usage}_${geojsonFilenamePrefix}.ts`)

export async function generateTSfiles(geocodingDirname, usageCountryMap, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Generating Country/State/City Map and Geojson Data Typescript files for usages: [${['all', ...Object.keys(usageCountryMap)].join(',')}]`)
    const countryStateCityGenerator = CountryStateCityMapGenerator(geocodingDirname)
    const geojsonDataGeocoding = {}

    const countryInfoArray = Object.values(await countryStateCityGenerator.loadMap(`${indent}\t`))
        .map(country => {
            const symbolname = normalizeName(country.name).toLowerCase()
            Object.keys(country.geocoding).forEach(dataFilenamePrefix => {
                const indexes = getRequiredGeojsonIndexes(country, dataFilenamePrefix)
                try {
                    if (undefined === geojsonDataGeocoding[dataFilenamePrefix]) {
                        geojsonDataGeocoding[dataFilenamePrefix] = []
                    }
                    geojsonDataGeocoding[dataFilenamePrefix] = sortFilterIndexes([
                        ...geojsonDataGeocoding[dataFilenamePrefix],
                        ...indexes
                    ])
                } catch (e) {
                    console.error(`Failed ${name}.geocoding[${dataFilenamePrefix}] ${JSON.stringify(country.geocoding)}`, e)
                    throw e
                }
            })
            return {
                name: country.name,
                symbolname,
                filename: `geocoded_${symbolname}.json`,
                geocoding: country.geocoding
            }
        })
    let generateCountryStateCityMapTS = true
    let generateGeojsonDataTS = true

    let countryStateCityMapTsFilepath = toCountryStateCityTsFilepath(geocodingDirname, 'all')
    if (fs.existsSync(countryStateCityMapTsFilepath)) {
        console.log(`${indent} - skipping Country/State/City Map Typescript generation ${Path.basename(countryStateCityMapTsFilepath)} already exists`)
        generateCountryStateCityMapTS = false
    }
    let geojsonDataTsFilepath = toGeojsonDataTsFilepath(geocodingDirname, Object.keys(geojsonDataGeocoding)[0], 'all')
    if (fs.existsSync(geojsonDataTsFilepath)) {
        console.log(`${indent} - skipping Geojson Data Typescript generation ${Path.basename(geojsonDataTsFilepath)} already exists`)
        generateGeojsonDataTS = false
    }
    if ([generateCountryStateCityMapTS, generateGeojsonDataTS].every(v => !v)) return

    if (generateCountryStateCityMapTS) {
        await generateCountryStateCityTSFile(countryInfoArray, countryStateCityMapTsFilepath, `${indent}\t`)
    }
    if (generateGeojsonDataTS) {
        for (const [geojsonFilenamePrefix, indexes] of Object.entries(geojsonDataGeocoding)) {
            geojsonDataTsFilepath = toGeojsonDataTsFilepath(geocodingDirname, geojsonFilenamePrefix, 'all')
            await generateGeojsonDataTSFile(geojsonFilenamePrefix, indexes, geojsonDataTsFilepath, `${indent}\t`)
        }
    }
    for (const [usage, countryArray] of Object.entries(usageCountryMap)) {
        const usageGeojsonDataGeocoding = {}
        const usageCountryInfoArray = countryInfoArray
            .filter(({ name }) => countryArray.includes(name))
            .map(countryInfo => {
                Object.keys(countryInfo.geocoding).forEach(dataFilenamePrefix => {
                    const indexes = getRequiredGeojsonIndexes(countryInfo, dataFilenamePrefix)
                    if (undefined === usageGeojsonDataGeocoding[dataFilenamePrefix]) {
                        usageGeojsonDataGeocoding[dataFilenamePrefix] = []
                    }
                    usageGeojsonDataGeocoding[dataFilenamePrefix] = sortFilterIndexes([
                        ...usageGeojsonDataGeocoding[dataFilenamePrefix],
                        ...indexes
                    ])
                })
                return countryInfo
            })
        countryStateCityMapTsFilepath = toCountryStateCityTsFilepath(geocodingDirname, usage)
        await generateCountryStateCityTSFile(usageCountryInfoArray, countryStateCityMapTsFilepath, `${indent}\t`)
        for (const [geojsonFilenamePrefix, indexes] of Object.entries(usageGeojsonDataGeocoding)) {
            geojsonDataTsFilepath = toGeojsonDataTsFilepath(geocodingDirname, geojsonFilenamePrefix, usage)
            await generateGeojsonDataTSFile(geojsonFilenamePrefix, indexes, geojsonDataTsFilepath, `${indent}\t`)
        }
    }
    await generateRegisterGetCountriesTSFile(Path.join(geocodingDirname, 'generated_registered_geocoded_country_state_city_map.ts'), `${indent}\t`)
    await generateRegisterGetGeojsonIndexTSFile(Object.keys(geojsonDataGeocoding), Path.join(geocodingDirname, 'generated_registered_geojson_data.ts'), `${indent}\t`)
    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}

