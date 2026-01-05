import { durationToString } from './functions.js'

export function createCountryStateCitiesMapFilter(regionFilter, regionIsoCodeMap, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Creating Country/State/City Filter from provided Valid Regions filter: [${regionFilter.join(', ')}]`)
    const counts = {
        country: 0,
        state: 0,
        cities: 0
    }
    const countryStatecityMapFilter = regionFilter
        .reduce((countryStateMap, region) => {
            const { countryCode, stateCities } = regionIsoCodeMap[region]
            if ([undefined, null].includes(countryStateMap[countryCode])) {
                counts.country = counts.country + 1
                countryStateMap[countryCode] = {}
            }
            counts.state = counts.state + Object.keys(stateCities).length
            Object.entries(stateCities).forEach(([state, cities]) => {
                if ([undefined, null].includes(countryStateMap[countryCode][state])) {
                    countryStateMap[countryCode][state] = []
                }
                counts.cities = counts.cities + cities.length
                countryStateMap[countryCode][state].push(...cities)
            })
            return countryStateMap
        }, {})
    console.log(`${indent}done! Filter contents ${counts.country} countries, ${counts.state} states, and ${counts.cities} cities (${durationToString(Date.now() - tstart)})`)
    return countryStatecityMapFilter
}