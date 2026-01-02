import { USCoastalRegionIsoCodeMap } from './geodata/us_coastline_regionisomap.js'
import { toArguments } from './src/argument_processor.js'
import { GenerateCommand } from './src/generate_command.js'


const args = toArguments(process.argv, 'tl_2025_us_coastline', USCoastalRegionIsoCodeMap, 5)

const { help, generate } = GenerateCommand(
    args.scriptName,
    args.geocodingDirname,
    args.shapefilenamePrefix,
    args.regionIsoCodeMap,
    args.defaultMaxMilesDistant
)

if (['?', '-?', 'h', 'help', '-h', '-help', undefined].includes(process.argv[2])) {
    help()
    exit
}

console.log(`${args.scriptName} ${process.argv.slice(2).join(' ')}`)

generate(args.maxMilesDistance, args.regionFilter)
