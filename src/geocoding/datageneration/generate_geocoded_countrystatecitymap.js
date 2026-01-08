import { USCoastalRegionIsoCodeMap } from './geodata/us_coastline_regionisomap.js'
import { UKCoastalRegionIsoCodeMap } from './geodata/uk_coastline_regionisomap.js'
import { UsageCountryMap } from './geodata/usage_country_map.js'
import { toArguments } from './src/argument_processor.js'
import { GenerateCommand } from './src/generate_command.js'
import { splitCountryStateCityJson } from './src/split_generated_countrystatecityjson.js'
import { generateTSfiles } from './src/generate_typescript_files.js'
const geocodingPrefixes = [
    { shapefilenamePrefix: 'tl_2025_us_coastline', shapefilenameSuffix: 'shp', regionIsoCodeMap: USCoastalRegionIsoCodeMap },
    { shapefilenamePrefix: 'ukcp18-uk-marine-coastline-hires', shapefilenameSuffix: 'shp', regionIsoCodeMap: UKCoastalRegionIsoCodeMap }
]
async function generateGeocoding(prefixes) {

    let geocodingDirname = undefined
    for ( const prefix of prefixes) {
        const args = toArguments(process.argv, prefix.shapefilenamePrefix, prefix.shapefilenameSuffix,prefix.regionIsoCodeMap, 5)
        geocodingDirname = args.geocodingDirname
        const { help, generate } = GenerateCommand(
            args.scriptName,
            args.geocodingDirname,
            args.shapefilenamePrefix,
            args.shapefilenameSuffix,
            args.regionIsoCodeMap,
            args.defaultMaxMilesDistant
        )

        if (['?', '-?', 'h', 'help', '-h', '-help', undefined].includes(process.argv[2])) {
            help()
            exit
        }

        console.log(`${args.scriptName} ${process.argv.slice(2).join(' ')} with ${prefix.shapefilenamePrefix}`)

        await generate(args.maxMilesDistance, args.regionFilter)
    }
    if (geocodingDirname) {
        await splitCountryStateCityJson(geocodingDirname, UsageCountryMap)
        await generateTSfiles(geocodingDirname, UsageCountryMap)
    }
}
generateGeocoding(geocodingPrefixes)
