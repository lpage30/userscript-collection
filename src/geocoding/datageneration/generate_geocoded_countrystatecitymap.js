import Path from 'path'
import { GeoDataInputArray, CountryDataInput, WorldRegionIsoCodeMap } from './src/DataInput.js'
import { TypescriptDataOutput } from './src/DataOutput.js'
import { CountryStateCityMapGenerator } from './src/countrystatecitymap_generator.js'
import { GeocodeGenerator } from './src/geocode_generator.js'
import { generateTypescriptfiles } from './src/generate_typescript_files.js'
const defaultMaxMilesDistance = 5

const help = (scriptName) => {
    console.log(`USAGE: ${scriptName} <geocoding-source-directory> [<maxMilesDistance>] [<region1>, <region2>....<regionN>]`)
    console.log(`<geocoding-source-directory> - full path to src/geocoding/assets`)
    console.log(`<maxMilesDistance> - maximum miles to consider for geojson for distant geojsonIndexes (default: ${defaultMaxMilesDistant}`)
    console.log(`<region> - any of the following (default: all): ${Object.keys(WorldRegionIsoCodeMap).join(', ')}`)
    Object.keys(WorldRegionIsoCodeMap).foreach(region => {
        console.log(`\t${region} == ${WorldRegionIsoCodeMap[region].country}: [${WorldRegionIsoCodeMap[region].states.join(',')}]`)
    })
    console.log('generates data for specified regions used by geocoding country/state/city data')
}

async function main() {
    const argvArray = process.argv
    const scriptNameArgument = Path.basename(argvArray[1])
    if (['?', '-?', 'h', 'help', '-h', '-help', undefined].includes(process.argv[2])) {
        help(scriptNameArgument)
        return
    }

    const geocodingDirpathArgument = argvArray[2]
    const maxMilesArgument = parseInt(argvArray[3])
    const regionFilterArgument = [...argvArray.slice(isNaN(maxMilesArgument) ? 3 : 4)]
        .map(region => region.toLowerCase().trim())
    const maxMilesDistance = isNaN(maxMilesArgument) ? defaultMaxMilesDistance : maxMilesArgument


    const geoDataInputs = GeoDataInputArray(geocodingDirpathArgument)
    const countryDataInput = CountryDataInput(geocodingDirpathArgument)
    const typescriptDataOutput = TypescriptDataOutput(geocodingDirpathArgument)

    console.log(`${scriptNameArgument} ${process.argv.slice(2).join(' ')}`)

    const countrystatecityMapGenerator = CountryStateCityMapGenerator(countryDataInput)
    await countrystatecityMapGenerator.generate(maxMilesDistance, '\t')

    for (const geoDataInput of geoDataInputs) {
        let regionFilter = Object.keys(geoDataInput.regionIsoCodeMap).filter(region => regionFilterArgument.includes(region))
        regionFilter = 0 < regionFilter.length ? regionFilter : Object.keys(geoDataInput.regionIsoCodeMap)

        const geocodeGenerator = GeocodeGenerator(countryDataInput, geoDataInput)
        await geocodeGenerator.generate(maxMilesDistance, regionFilter)
    }
    await countrystatecityMapGenerator.splitCountryMaps('')
    await generateTypescriptfiles(typescriptDataOutput, countryDataInput, geoDataInputs, '')
}
main()
