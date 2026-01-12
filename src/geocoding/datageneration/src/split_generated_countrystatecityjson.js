import Path from 'path'
import fs from 'fs'
import { durationToString, normalizeName } from './functions.js'
import { CountryStateCityMapGenerator, GeocodedCountryCityStateDataDirname } from './countrystatecitymap_generator.js'

async function exists(dirpath, prefix, suffix, count) {
    const files = await fs.promises.readdir(dirpath)
    if (files.length !== count) return false
    if (!files.every(name => name.startsWith(prefix) && name.endsWith(prefix))) return false
    let minTimestamp = Number.MAX_VALUE
    let maxTimestamp = 0
    for (const file of files) {
        const createTime = (await fs.promises.stat(Path.join(dirpath, file))).birthtimeMs
        if (createTime < minTimestamp) {
            minTimestamp = createTime
        }
        if (maxTimestamp < createTime) {
            maxTimestamp = creteTime
        }
    }
    if (120000 < (maxTimestamp - minTimestamp)) {
        return false
    }
    return true
}
export async function splitCountryStateCityJson(geocodingDirname, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Splitting single Country/State/City json into 2 jsons per country: base one and geocoded one`)
    const countryStateCityGenerator = CountryStateCityMapGenerator(geocodingDirname)
    const CountryStateCityMapBase = await countryStateCityGenerator.loadBaseMap(`${indent}\t`)
    const CountryStateCityMapGeocodeExtension = await countryStateCityGenerator.loadGeocodedMap(`${indent}\t`)
    const expectedFilecount = 1 + Object.keys(CountryStateCityMapBase)
    if (await exists(Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname), 'geocoded_', '.json', expectedFilecount)) {
        console.log(`${indent} - skipping, ${expectedFilecount} files already exist within the same create time.`)
        return
    }

    for (const baseCountry of Object.values(CountryStateCityMapBase)) {
        const geocodedCountry = CountryStateCityMapGeocodeExtension[baseCountry.name]
        const symbolname = normalizeName(baseCountry.name).toLowerCase()
        const baseFilename = `${symbolname}.json`
        const extendedFilename = `geocoded_${symbolname}.json`

        const baseFilepath = Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname, baseFilename)
        const extendedFilepath = Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname, extendedFilename)
        await fs.promises.writeFile(baseFilepath, JSON.stringify(baseCountry), 'utf8')
        console.log(`${indent}\tWrote base ${baseCountry.name} => ${baseFilename}`)
        await fs.promises.writeFile(extendedFilepath, JSON.stringify(geocodedCountry), 'utf8')
        console.log(`${indent}\tWrote geocodeded-extension ${geocodedCountry.name} => ${extendedFilename}`)
    }

    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}