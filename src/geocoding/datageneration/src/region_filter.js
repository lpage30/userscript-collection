import { durationToString } from './functions.js'

export function createCountryStateMapFilter(regionFilter, regionIsoCodeMap, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Creating Country/State/City Filter from provided Valid Regions filter: [${regionFilter.join(', ')}]`)
    const counts = {
        country: 0,
        state: 0
    }
    const countryStatecityMapFilter = regionFilter
        .reduce((countryStateMap, region) => {
            const { countryCode, stateCodes } = regionIsoCodeMap[region]
            if ([undefined, null].includes(countryStateMap[countryCode])) {
                counts.country = counts.country + 1
                countryStateMap[countryCode] = []
            }
            counts.state = counts.state + stateCodes.length
            countryStateMap[countryCode].push(...stateCodes)
            return countryStateMap
        }, {})
    console.log(`${indent}done! Filter contents ${counts.country} countries, and ${counts.state} states (${durationToString(Date.now() - tstart)})`)
    return countryStatecityMapFilter
}