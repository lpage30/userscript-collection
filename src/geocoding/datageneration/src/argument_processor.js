import Path from 'path'

export const toArguments = (argvArray, shapefilenamePrefix, regionIsoCodeMap, defaultMaxMilesDistant) => {

    let maxMilesDistance = parseInt(argvArray[3])
    const regionFilterArgpos = isNaN(maxMilesDistance) ? 3 : 4
    let regionFilter = [...argvArray.slice(regionFilterArgpos)].map(region => region.toLowerCase().trim())

    maxMilesDistance = isNaN(maxMilesDistance) ? defaultMaxMilesDistant : maxMilesDistance
    regionFilter = Object.keys(regionIsoCodeMap).filter(region => regionFilter.includes(region))
    regionFilter = 0 < regionFilter.length ? regionFilter : Object.keys(regionIsoCodeMap)

    return {
        scriptName: Path.basename(argvArray[1]),
        geocodingDirname: argvArray[2],
        shapefilenamePrefix,
        regionIsoCodeMap,
        defaultMaxMilesDistant,
        maxMilesDistance,
        regionFilter
    }
}