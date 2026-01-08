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
export async function splitCountryStateCityJson(geocodingDirname, usageCountryMap, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Splitting single Country/State/City json into 1 json per country`)
    const countryStateCityGenerator = CountryStateCityMapGenerator(geocodingDirname)
    const CountryStateCityMap = await countryStateCityGenerator.loadMap(`${indent}\t`)
    const countryInfoArray = []
    const expectedFilecount = 1 + Object.keys(CountryStateCityMap)
    if (await exists(Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname), 'geocoded_', '.json', expectedFilecount)) {
        console.log(`${indent} - skipping, ${expectedFilecount} files already exist within the same create time.`)
        return
    }

    for (const country of Object.values(CountryStateCityMap)) {
        const symbolname = normalizeName(country.name).toLowerCase()
        const filename = `geocoded_${symbolname}.json`
        countryInfoArray.push({ name: country.name, symbolname, filename })

        const filepath = Path.join(geocodingDirname, filename)
        await fs.promises.writeFile(Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname, filename), JSON.stringify(country), 'utf8')
        console.log(`${indent}\tWrote ${country.name} => ${filename}`)
    }

    console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
}