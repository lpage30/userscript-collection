import fs from 'fs'
import Path from 'path'
import { durationToString } from './functions.js'
import { Country, State, City } from 'country-state-city';
import { CountryDataOutput } from './DataOutput.js';

export function getRequiredGeojsonIndexes(country, datasourceName) {
    const coding = country.geocoding[datasourceName] ?? { geojsonIndexes: [], distantGeojsonIndexes: [] }
    return [...coding.geojsonIndexes, ...coding.distantGeojsonIndexes]
}
function createCountryStateCityMap(indent, { asBaseMap, asGeocodedMap, maxMilesDistance }) {
    const tstart = Date.now()
    if (!asBaseMap && !asGeocodedMap) {
        throw new Error('createCountryStateCityMap: Missing "asBaseMap" and/or "asGeocodedMap" arguments')
    }
    if (asGeocodedMap && isNaN(maxMilesDistance)) {
        throw new Error('createCountryStateCityMap: Missing "maxMilesDistance" for "asGeocodedMap" creation arguments')
    }
    const mapTypeName = `${asBaseMap ? 'BaseMap' : ''} ${asGeocodedMap ? 'GeocodeExtensionMap' : ''} ${asBaseMap && asGeocodedMap ? 'Combined Base+GeocodeExtensionMap' : ''}`
    console.log(`${indent}Creating world Country/State/City ${mapTypeName}`)
    const counts = {
        country: 0,
        state: 0,
        city: 0,
    }
    const geocodeExtension = {
        geocoding: {},
        distantMaxMiles: maxMilesDistance,
    }
    const toFloat = (value) => {
        if ('number' === typeof value) return value
        const result = parseFloat(value)
        return isNaN(result) ? undefined : result
    }
    const countryStateCityMap = Country.getAllCountries().reduce((countryMap, country) => {
        counts.country = counts.country + 1
        const countryCoordinates = [
            { lat: toFloat(country.latitude), lon: toFloat(country.longitude) }
        ]
        const statesOfCountry = (State.getStatesOfCountry(country.isoCode) ?? []).reduce((stateMap, state) => {
            counts.state = counts.state + 1
            const stateCoordinates = [
                { lat: toFloat(state.latitude), lon: toFloat(state.longitude) }
            ]
            const citiesOfState = (City.getCitiesOfState(country.isoCode, state.isoCode) ?? []).reduce((cityMap, city) => {
                counts.city = counts.city + 1
                stateCoordinates.push({ lat: toFloat(city.latitude), lon: toFloat(city.longitude) })
                return {
                    ...cityMap,
                    [city.name]: {
                        name: city.name,
                        lat: toFloat(city.latitude),
                        lon: toFloat(city.longitude),
                        ...(asBaseMap ? {
                            countryName: country.name,
                            stateName: state.name,
                        } : {}),
                        ...(asGeocodedMap ? geocodeExtension : {})

                    }
                }
            }, {})
            const stateResult = {
                ...stateMap,
                [state.name]: {
                    name: state.name,
                    lat: toFloat(state.latitude),
                    lon: toFloat(state.longitude),
                    cities: citiesOfState,
                    ...(asBaseMap ? {
                        countryName: country.name,
                        isoCode: state.isoCode,
                        containedCoordinates: stateCoordinates.filter(({ lat, lon }) => ![undefined, null].some(v => [lat, lon].includes(v))),
                    } : {}),
                    ...(asGeocodedMap ? geocodeExtension : {})

                }
            }
            if (asBaseMap) {
                countryCoordinates.push(...stateResult[state.name].containedCoordinates)
            }
            return stateResult
        }, {})
        return {
            ...countryMap,
            [country.name]: {
                name: country.name,
                lat: toFloat(country.latitude),
                lon: toFloat(country.longitude),
                states: statesOfCountry,
                ...(asBaseMap ? {
                    isoCode: country.isoCode,
                    containedCoordinates: countryCoordinates.filter(({ lat, lon }) => ![undefined, null].some(v => [lat, lon].includes(v))),
                } : {}),
                ...(asGeocodedMap ? geocodeExtension : {})
            }
        }
    }, {})
    console.log(`${indent}done! ${mapTypeName} contents ${counts.country} countries, ${counts.state} states, and ${counts.city} cities (${durationToString(Date.now() - tstart)})`)
    return countryStateCityMap
}

async function exists(dirpath, prefix, suffix, count) {
    const files = await fs.promises.readdir(dirpath)
    if (files.length !== count) return false
    if (!files.every(name => name.startsWith(prefix) && name.endsWith(prefix))) return false
    let minTimestamp = Number.MAX_VALUE
    let maxTimestamp = 0
    for (const file of files) {
        const createTime = (await fs.promises.stat(Path.join(dirpath, file))).birthtimeMs
        if (createTime < minTimestamp) {
            minTimestamp = createTime
        }
        if (maxTimestamp < createTime) {
            maxTimestamp = creteTime
        }
    }
    if (120000 < (maxTimestamp - minTimestamp)) {
        return false
    }
    return true
}
export const CountryStateCityMapGenerator = (countryDataInput) => {
    const countryDataOutput = CountryDataOutput(countryDataInput)

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
    const generate = async (maxMilesDistance, indent) => {
        const tstart = Date.now()
        console.log(`${indent}Generating World Country-State-City Maps`)
        if (!fs.existsSync(countryDataOutput.mapJsonFilepath)) {
            const countryStateCityMap = createCountryStateCityMap(`${indent}\t`, { asBaseMap: true })
            await writeMap(countryDataOutput.mapJsonFilepath, countryStateCityMap, `${indent}\t`)
        } else {
            console.log(`${indent} - skipping, ${Path.basename(countryDataOutput.mapJsonFilepath)} already generated.`)
        }

        if (!fs.existsSync(countryDataOutput.mapGeocodedJsonFilepath)) {
            const baseCountryStateCityMap = await loadMap(countryDataOutput.mapJsonFilepath, `${indent}\t`)
            const countryStateCityMap = createCountryStateCityMap(`${indent}\t`, { asGeocodedMap: true, maxMilesDistance })
            await writeMap(countryDataOutput.mapGeocodedJsonFilepath, countryStateCityMap, `${indent}\t`)
        } else {
            console.log(`${indent} - skipping, ${Path.basename(countryDataOutput.mapGeocodedJsonFilepath)} already generated.`)
        }
        const durationms = Date.now() - tstart
        console.log(`${indent}done! duration: ${durationToString(durationms)}`)
    }

    const splitCountryMaps = async (indent) => {
        const tstart = Date.now()
        console.log(`${indent}split Country/State/City map json into 2 jsons per country: base one and geocoded one`)
        const countryDataOutput = CountryDataOutput(countryDataInput)

        const countryStateCityMapBase = await loadMap(countryDataOutput.mapJsonFilepath, `${indent}\t`)
        const countryStateCityMapGeocodeExtension = await loadMap(countryDataOutput.mapGeocodedJsonFilepath, `${indent}\t`)

        const expectedFilecount = 1 + Object.keys(countryStateCityMapBase)
        if (await exists(
            countryDataOutput.outputDirpath,
            countryDataOutput.geocodedCountryMapParts.prefix,
            countryDataOutput.geocodedCountryMapParts.suffix,
            expectedFilecount
        )) {
            console.log(`${indent} - skipping, ${expectedFilecount} files already exist within the same create time.`)
            return
        }

        for (const baseCountry of Object.values(countryStateCityMapBase)) {
            const geocodedCountry = countryStateCityMapGeocodeExtension[baseCountry.name]

            const baseFilepath = countryDataOutput.toCountryFilepath(baseCountry.name)
            await fs.promises.writeFile(baseFilepath, JSON.stringify(baseCountry), 'utf8')
            console.log(`${indent}\tWrote base ${baseCountry.name} => ${Path.basename(baseFilepath)}`)

            const extendedFilepath = countryDataOutput.toGeocodedCountryFilepath(baseCountry.name)
            await fs.promises.writeFile(extendedFilepath, JSON.stringify(geocodedCountry), 'utf8')
            console.log(`${indent}\tWrote geocoded-extension ${geocodedCountry.name} => ${Path.basename(extendedFilepath)}`)
        }

        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    return {
        loadBaseMap: (indent = '') => loadMap(countryDataOutput.mapJsonFilepath, indent),
        writeBaseMap: (indent = '') => writeMap(countryDataOutput.mapJsonFilepath, indent),
        loadGeocodedMap: (indent = '') => loadMap(countryDataOutput.mapGeocodedJsonFilepath, indent),
        writeGeocodedMap: (indent = '') => writeMap(countryDataOutput.mapGeocodedJsonFilepath, indent),
        generate,
        splitCountryMaps
    }
}
