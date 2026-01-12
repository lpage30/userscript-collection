import fs from 'fs'
import Path from 'path'
import { durationToString } from './functions.js'
import { Country, State, City } from 'country-state-city';

export const GeocodedCountryCityStateDataDirname = 'geocodedcountrystatecitydata'
export const CountryStateCityMapJsonFilename = 'country_state_city_map.json'
export const CountryStateCityMapGeocodedJsonFilename = 'geocoded_country_state_city_map.json'


export function getRequiredGeojsonIndexes(country, geojsonFilenamePrefix) {
    const coding = country.geocoding[geojsonFilenamePrefix] ?? { geojsonIndexes: [], distantGeojsonIndexes: []}
    return [...coding.geojsonIndexes, ...coding.distantGeojsonIndexes]
}
function createCountryStateCityMapBase(indent = '') {
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
                states: statesOfCountry
            }
        }
    }, {})
    console.log(`${indent}done! Base Map contents ${counts.country} countries, ${counts.state} states, and ${counts.city} cities (${durationToString(Date.now() - tstart)})`)
    return countryStateCityMap
}
function createCountryStateCityMapGeocodeExtension(maxMilesDistant, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Creating world Country/State/City Map Geocoded Extension`)
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
    const countryStateCityMapGeocodeExtension = Country.getAllCountries().reduce((countryMap, country) => {
        counts.country = counts.country + 1
        const statesOfCountry =  (State.getStatesOfCountry(country.isoCode) ?? []).reduce((stateMap, state) => {
            country.state = country.state + 1
            const citiesOfState = (City.getCitiesOfState(country.isoCode, state.isoCode) ?? []).reduce((cityMap, city) => {
                counts.city = counts.city + 1
                return {
                    ...cityMap,
                    [city.name]: {
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
                    lat: toFloat(state.latitude),
                    lon: toFloat(state.longitude),
                    geocoding: {},
                    distantMaxMiles: maxMilesDistant,
                    cities: citiesOfState
                }
            }
            return stateResult
        },{})
        return {
            ...countryMap,
            [country.name]: {
                name: country.name,
                lat: toFloat(country.latitude),
                lon: toFloat(country.longitude),
                geocoding: {},
                distantMaxMiles: maxMilesDistant,
                states: statesOfCountry
            }
        }
    }, {})
    console.log(`${indent}done! Geocoded Extension contents ${counts.country} countries, ${counts.state} states, and ${counts.city} cities (${durationToString(Date.now() - tstart)})`)
    return countryStateCityMapGeocodeExtension
}
export const CountryStateCityMapGenerator = (geocodingDirname) => {
    if (!fs.existsSync(geocodingDirname)) {
        throw new Error(`CountryStateCityGenerator: directory ${geocodingDirname} does not exist`)
    }

    const countryStateCityMapJsonFilepath = Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname, CountryStateCityMapJsonFilename)
    const countryStateCityMapGeocodedJsonFilepath = Path.join(geocodingDirname, GeocodedCountryCityStateDataDirname, CountryStateCityMapGeocodedJsonFilename)

    const loadMap = async (filepath, indent = '') => {
        if (!fs.existsSync(filepath)) {
            throw new Error(`CountryStateCityMapGenerator: ${filepath} does not exist`)
        }
        const tstart = Date.now()
        console.log(`${indent}Loading ${Path.basename(filepath)}`)
        const { default: CountryStateCityMap } = await import(filepath, {
            with: { type: 'json' }
        })
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
        return CountryStateCityMap
    }
    const writeMap = async (filepath, countryStateCityMap, indent = '') => {
        const tstart = Date.now()
        console.log(`${indent}Writing ${Path.basename(filepath)} to ${filepath}`)
        const data = JSON.stringify(countryStateCityMap)
        try {
            await fs.promises.writeFile(`${filepath}`, data, 'utf8')
        } catch (e) {
            throw new Error(`Failed writeCountryStateCityMap ${data.length} len string. ${e}`)
        }
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    const generate = async (maxMilesDistance, indent = '') => {
        const tstart = Date.now()
        console.log(`${indent}Generating World Country-State-City Maps`)
        if (!fs.existsSync(`${countryStateCityMapJsonFilepath}`)) {
            const countryStateCityMap = createCountryStateCityMapBase(`${indent}\t`)
            await writeMap(countryStateCityMapJsonFilepath, countryStateCityMap, `${indent}\t`)
        } else {
            console.log(`${indent} - skipping, ${Path.basename(countryStateCityMapJsonFilepath)} already generated.`)
        }

        if (!fs.existsSync(`${countryStateCityMapGeocodedJsonFilepath}`)) {
            const countryStateCityMap = createCountryStateCityMapGeocodeExtension(maxMilesDistance, `${indent}\t`)
            await writeMap(countryStateCityMapGeocodedJsonFilepath, countryStateCityMap, `${indent}\t`)
        } else {
            console.log(`${indent} - skipping, ${Path.basename(countryStateCityMapGeocodedJsonFilepath)} already generated.`)
        }
        const durationms = Date.now() - tstart
        console.log(`${indent}done! duration: ${durationToString(durationms)}`)
    }

    return {
        loadBaseMap: (indent='') => loadMap(countryStateCityMapJsonFilepath, indent),
        writeBaseMap: (indent='') => writeMap(countryStateCityMapJsonFilepath, indent),
        loadGeocodedMap: (indent='') => loadMap(countryStateCityMapGeocodedJsonFilepath, indent),
        writeGeocodedMap: (indent='') => writeMap(countryStateCityMapGeocodedJsonFilepath, indent),
        generate
    }
}
