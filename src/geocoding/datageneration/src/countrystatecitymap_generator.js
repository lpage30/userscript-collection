import fs from 'fs'
import Path from 'path'
import { durationToString } from './functions.js'
import { Country, State, City } from 'country-state-city';

export const GeocodedCountryCityStateDataDirname = 'geocodedcountrystatecitydata'
export const CountryStateCityMapJsonFilename = 'geocoded_country_state_city_map.json'


export function getRequiredGeojsonIndexes(country, geojsonFilenamePrefix) {
    const coding = country.geocoding[geojsonFilenamePrefix] ?? { geojsonIndexes: [], distantGeojsonIndexes: []}
    return [...coding.geojsonIndexes, ...coding.distantGeojsonIndexes]
}
function createCountryStateCityMap(maxMilesDistant, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Creating world Country/State/City Map`)
    const counts = {
        country: 0,
        state: 0,
        city: 0,
    }
    const toFloat = (value) => {
        if ('number' === typeof value) return value
        const result = parseFloat(value)
        return isNaN(result) ? undefined : result
    }
    const countryStateCityMap = Country.getAllCountries().reduce((countryMap, country) => {
        counts.country = counts.country + 1
        const countryCoordinates = [
            {lat: toFloat(country.latitude), lon: toFloat(country.longitude)}
        ]
        const statesOfCountry =  (State.getStatesOfCountry(country.isoCode) ?? []).reduce((stateMap, state) => {
            country.state = country.state + 1
            const stateCoordinates = [
                {lat: toFloat(state.latitude), lon: toFloat(state.longitude)}
            ]
            const citiesOfState = (City.getCitiesOfState(country.isoCode, state.isoCode) ?? []).reduce((cityMap, city) => {
                counts.city = counts.city + 1
                stateCoordinates.push({lat: toFloat(city.latitude), lon: toFloat(city.longitude)})
                return {
                    ...cityMap,
                    [city.name]: {
                        countryName: country.name,
                        stateName: state.name,
                        name: city.name,
                        lat: toFloat(city.latitude),
                        lon: toFloat(city.longitude),
                        geocoding: {},
                        distantMaxMiles: maxMilesDistant,
                    }
                }
            }, {})
            const stateResult = {
                ...stateMap,
                [state.name]: {
                    countryName: country.name,
                    name: state.name,
                    isoCode: state.isoCode,
                    lat: toFloat(state.latitude),
                    lon: toFloat(state.longitude),
                    containedCoordinates: stateCoordinates.filter(({lat, lon}) => ![undefined, null].some(v => [lat, lon].includes(v))),
                    geocoding: {},
                    distantMaxMiles: maxMilesDistant,
                    cities: citiesOfState
                }
            }
            countryCoordinates.push(...stateResult[state.name].containedCoordinates)
            return stateResult
        },{})
        return {
            ...countryMap,
            [country.name]: {
                name: country.name,
                isoCode: country.isoCode,
                lat: toFloat(country.latitude),
                lon: toFloat(country.longitude),
                containedCoordinates: countryCoordinates.filter(({lat, lon}) => ![undefined, null].some(v => [lat, lon].includes(v))),
                geocoding: {},
                distantMaxMiles: maxMilesDistant,
                states: statesOfCountry
            }
        }
    }, {})
    console.log(`${indent}done! Map contents ${counts.country} countries, ${counts.state} states, and ${counts.city} cities (${durationToString(Date.now() - tstart)})`)
    return countryStateCityMap
}
export const CountryStateCityMapGenerator = (geocodingDirname) => {
    if (!fs.existsSync(geocodingDirname)) {
        throw new Error(`CountryStateCityGenerator: directory ${geocodingDirname} does not exist`)
    }

    const countryStateCityMapJsonFilepath = Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname, CountryStateCityMapJsonFilename)

    const loadMap = async (indent = '') => {
        if (!fs.existsSync(countryStateCityMapJsonFilepath)) {
            throw new Error(`CountryStateCityMapGenerator: ${countryStateCityMapJsonFilepath} does not exist`)
        }
        const tstart = Date.now()
        console.log(`${indent}Loading CountryStateCityMap`)
        const { default: CountryStateCityMap } = await import(countryStateCityMapJsonFilepath, {
            with: { type: 'json' }
        })
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
        return CountryStateCityMap
    }
    const writeMap = async (countryStateCityMap, indent = '') => {
        const tstart = Date.now()
        console.log(`${indent}Writing Country/State/City map to ${countryStateCityMapJsonFilepath}`)
        const data = JSON.stringify(countryStateCityMap)
        try {
            await fs.promises.writeFile(`${countryStateCityMapJsonFilepath}`, data, 'utf8')
        } catch (e) {
            throw new Error(`Failed writeCountryStateCityMap ${data.length} len string. ${e}`)
        }
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    const generate = async (maxMilesDistance, indent = '') => {
        const tstart = Date.now()
        console.log(`${indent}Generating World Country-State-City Map`)
        if (fs.existsSync(`${countryStateCityMapJsonFilepath}`)) {
            console.log(`${indent} - skipping, already generated.`)
            return
        }
        const countryStateCityMap = createCountryStateCityMap(maxMilesDistance, `${indent}\t`)
        await writeMap(countryStateCityMap, `${indent}\t`)
        const durationms = Date.now() - tstart
        console.log(`${indent}done! duration: ${durationToString(durationms)}`)
    }

    return {
        loadMap,
        writeMap,
        generate
    }
}
