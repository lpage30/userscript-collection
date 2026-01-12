import { Country, State, City } from 'country-state-city'
import { durationToString } from './functions.js'

export function createCountryStateCitiesMapFilter(countryStateCityMapBase, regionFilter, regionIsoCodeMap, indent = '') {
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
            const countryName = Country.getCountryByCode(countryCode).name
            if ([undefined, null].includes(countryStateMap[countryName])) {
                counts.country = counts.country + 1
                countryStateMap[countryName] = {}
            }
            counts.state = counts.state + Object.keys(stateCities).length
            console.log(`${indent}\t${countryName} => ${Object.keys(stateCitiesMap).join(',')} states`)

            Object.entries(stateCities).forEach(([state, cityArray]) => {
                const stateName = State.getStatesOfCountry(countryCode)
                    .filter(({ isoCode, name }) => [isoCode, name].includes(stateCode))[0].name
                if ([undefined, null].includes(countryStateMap[countryName][stateName])) {
                    countryStateMap[countryName][stateName] = []
                }
                const stateCities = 0 === cityArray.length
                    ? City.getCitiesOfState(countryCode, state.isoCode)
                    : City.getCitiesOfState(countryCode, state.isoCode)
                        .filter(({ name }) => cityArray.includes(name))

                console.log(`${indent}\t\t${stateName} => ${stateCities.length} cities`)
                counts.cities = counts.cities + stateCities.length
                stateCities.forEach(cityObj => {
                    countryStateMap[countryName][stateName].push(cityObj.name)
                })
            })
            return countryStateMap
        }, {})
    console.log(`${indent}done! Filter contents ${counts.country} countries, ${counts.state} states, and ${counts.cities} cities (${durationToString(Date.now() - tstart)})`)
    return countryStatecityMapFilter
}