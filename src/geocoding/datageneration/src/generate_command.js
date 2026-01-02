import { durationToString } from './functions.js'
import { CountryStateCityMapGenerator } from './countrystatecitymap_generator.js'
import { GeocodeGenerator } from './geocode_generator.js'

export const GenerateCommand = (
    scriptName,
    geocodingDirname,
    shapefilenamePrefix,
    regionIsoCodeMap,
    defaultMaxMilesDistant,
) => {

    const help = () => {
        console.log(`USAGE: ${scriptName} <geocoding-source-directory> [<maxMilesDistance>] [<region1>, <region2>....<regionN>]`)
        console.log(`<geocoding-source-directory> - full path to src/geocoding/assets`)
        console.log(`<maxMilesDistance> - maximum miles to consider for geojson for distant geojsonIndexes (default: ${defaultMaxMilesDistant}`)
        console.log(`<region> - any of the following (default: all): ${Object.keys(regionIsoCodeMap).join(', ')}`)
        Object.keys(regionIsoCodeMap).foreach(region => {
            console.log(`\t${region} == ${regionIsoCodeMap[region].country}: [${regionIsoCodeMap[region].states.join(',')}]`)
        })
        console.log('generates data for specified regions used by geocoding country/state/city data')
    }

    const generate = async (maxMilesDistance, regionFilter) => {
        const countrystatecityMapGenerator = CountryStateCityMapGenerator(geocodingDirname)
        const geocodeGenerator = GeocodeGenerator(geocodingDirname, shapefilenamePrefix, regionIsoCodeMap)
        const tstart = Date.now()
        console.log(`Generating Assets`)

        await countrystatecityMapGenerator.generate(maxMilesDistance, '\t')
        await geocodeGenerator.generate(maxMilesDistance, regionFilter, '\t')
        const durationms = Date.now() - tstart
        console.log(`done! duration: ${durationToString(durationms)}`)
    }
    return {
        help,
        generate
    }
}