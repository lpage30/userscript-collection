import { Country, State, City } from 'country-state-city'
import * as turf from '@turf/turf'
import shp from 'shpjs'
import Path from 'path'
import fs from 'fs'
import { durationToString, sortFilterIndexes } from './functions.js'
import { createCountryStateCitiesMapFilter } from './region_filter.js'
import { CountryStateCityMapGenerator, getRequiredGeojsonIndexes } from './countrystatecitymap_generator.js'
import { GeoDataOutput } from './DataOutput.js'

function geojsonToIndexedGeojson(geojson) {
    if (geojson.features.every(feature => 'MultiPolygon' === feature.geometry.type)) {
        return geojson.features
            .map(feature => geojsonToIndexedGeojson(
                turf.polygonToLine(
                    turf.multiPolygon(feature.geometry.coordinates, { bbox: feature.geometry.bbox })
                )
            )
            ).flat()
            .map(({ polygon, lineString }, index) => ({
                index,
                lineString,
                polygon,
            }))
    }
    return geojson.features
        .map((feature, index) => ({
            index,
            lineString: turf.lineString(feature.geometry.coordinates),
            polygon: turf.bboxPolygon(feature.geometry.bbox ?? feature.properties.bbox),
        }))
}

function findBestGeojsonIndex(lat, lon, datasourcedIndexedGeojson, maxDistance) {
    if ([lat, lon].some(v => null == v || undefined == v || isNaN(v))) return undefined

    try {
        const source = turf.point([lon, lat])
        const geojsonIndex = datasourcedIndexedGeojson.indexedGeojson
            .find(data => turf.booleanPointInPolygon(source, data.polygon))
        if (undefined !== geojsonIndex) {
            return {
                geojsonIndex: geojsonIndex.index
            }
        }
        const maxDistanceCircle = turf.circle(source, maxDistance, { units: 'miles' })
        const { data } = datasourcedIndexedGeojson.indexedGeojson
            .filter(data => turf.booleanIntersects(maxDistanceCircle, data.polygon))
            .reduce((minDistanceIndex, data) => {
                const destination = turf.nearestPointOnLine(data.lineString, source).geometry;
                const distance = turf.distance(source, destination, { units: 'miles' })
                if (distance <= maxDistance && distance < minDistanceIndex.distance) {
                    return {
                        distance,
                        data
                    }
                }
                return minDistanceIndex
            }, { distance: Number.MAX_VALUE, data: undefined })
        if (undefined !== data) {
            return {
                distantGeojsonIndex: data.index
            }
        }
        return undefined
    } catch (e) {
        throw new Error(`Failed Finding: ${namedIndexedGeojson.datasourceName}@lat(${lat})lon(${lon}). ${e}`)
    }
}


function geocodeCountryStateCityMap(countryStateCityMap, countryStateCityMapGeocodeFilter, datasourcedIndexedGeojson, maxMilesDistance, indent = '') {
    const { datasourceName, indexedGeojson } = datasourcedIndexedGeojson
    console.log(`${indent}Geocoding subset of country/state/cities with ${datasourceName} geojson`)
    const { filterCountries, filterStates, filterCities } = Object.values(countryStateCityMapGeocodeFilter).reduce((filterCounts, country) => {
        return Object.values(country).reduce((filterCounts2, state) => ({
            ...filterCounts2,
            filterStates: filterCounts2.filterStates + 1,
            filterCities: filterCounts2.filterCities + state.length
        }), { ...filterCounts, filterCountries: filterCounts.filterCountries + 1 })
    }, { filterCountries: 0, filterStates: 0, filterCities: 0 })

    const tstart = Date.now()
    let counts = {
        geocodedCountries: 0, geocodedStates: 0, geocodedCities: 0
    }
    let statusCounts = {
        countries: 0, states: 0, cities: 0
    }
    let logtime = tstart
    const logProgress = (sourcePath, cities = -1, forceLog = false) => {
        if (forceLog || 30000 < (Date.now() - logtime)) {
            const totalCities = -1 === cities ? (0 === filterCities ? 'all' : `${filterCities}`) : `${cities}`
            console.log(`${indent}${'\t'.repeat(sourcePath.length)}${sourcePath.join('-')}[${durationToString(Date.now() - tstart)}]> Progress: ${statusCounts.countries}/${filterCountries} countries(${counts.geocodedCountries}), ${statusCounts.states}/${filterStates} states(${counts.geocodedStates}), and ${statusCounts.cities}/${totalCities} cities(${counts.geocodedCities}))`)
            logtime = Date.now()
        }
    }
    const requiredGeojsonIndexes = []
    const sourcePath = ['', '', '']
    let totalCities = 0
    Object.entries(countryStateCityMapGeocodeFilter).forEach(([countryName, stateCitiesMap]) => {
        const country = countryStateCityMap[countryName]
        sourcePath[0] = country.name
        console.log(`${indent}\t${country.name} => ${Object.keys(stateCitiesMap).join(',')} states`)
        if (undefined === country.geocoding[datasourceName]) {
            country.geocoding[datasourceName] = {
                geojsonIndexes: [],
                distantGeojsonIndexes: []

            }
        }
        Object.entries(stateCitiesMap).forEach(([stateName, cityNameArray]) => {
            const state = country.states[stateName]
            sourcePath[1] = state.name
            const cities = Object.values(state.cities).filter(({ name }) => 0 === cityNameArray.length || cityNameArray.includes(name))
            if (undefined === state.geocoding[datasourceName]) {
                state.geocoding[datasourceName] = {
                    geojsonIndexes: [],
                    distantGeojsonIndexes: []

                }
            }

            console.log(`${indent}\t\t${state.name} => ${cities.length} cities`)

            totalCities = totalCities + cities.length
            cities.forEach(city => {
                sourcePath[2] = city.name
                if (undefined === city.geocoding[datasourceName]) {
                    city.geocoding[datasourceName] = {
                        geojsonIndexes: [],
                        distantGeojsonIndexes: []

                    }
                }
                const bestIndex = findBestGeojsonIndex(city.lat, city.lon, datasourcedIndexedGeojson, maxMilesDistance)
                if (undefined !== bestIndex && [bestIndex.geojsonIndex, bestIndex.distantGeojsonIndex].some(v => undefined !== v)) {
                    counts = {
                        ...counts,
                        geocodedCities: counts.geocodedCities + 1
                    }
                    if (undefined !== bestIndex.geojsonIndex) {
                        city.geocoding[datasourceName].geojsonIndexes.push(bestIndex.geojsonIndex)
                        state.geocoding[datasourceName].geojsonIndexes.push(bestIndex.geojsonIndex)
                        country.geocoding[datasourceName].geojsonIndexes.push(bestIndex.geojsonIndex)
                        requiredGeojsonIndexes.push(bestIndex.geojsonIndex)
                    }
                    if (undefined !== bestIndex.distantGeojsonIndex) {
                        city.geocoding[datasourceName].distantGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                        state.geocoding[datasourceName].distantGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                        country.geocoding[datasourceName].distantGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                        requiredGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                    }
                }
                statusCounts = {
                    ...statusCounts,
                    cities: statusCounts.cities + 1
                }
                logProgress(sourcePath, totalCities)
            })
            const bestIndex = findBestGeojsonIndex(state.lat, state.lon, datasourcedIndexedGeojson, maxMilesDistance)
            if (undefined !== bestIndex && [bestIndex.geojsonIndex, bestIndex.distantGeojsonIndex].some(v => undefined !== v)) {
                counts = {
                    ...counts,
                    geocodedStates: counts.geocodedStates + 1
                }
                if (undefined !== bestIndex.geojsonIndex) {
                    state.geocoding[datasourceName].geojsonIndexes.push(bestIndex.geojsonIndex)
                    country.geocoding[datasourceName].geojsonIndexes.push(bestIndex.geojsonIndex)
                    requiredGeojsonIndexes.push(bestIndex.geojsonIndex)
                }
                if (undefined !== bestIndex.distantGeojsonIndex) {
                    state.geocoding[datasourceName].distantGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                    country.geocoding[datasourceName].distantGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                    requiredGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                }
            }
            state.geocoding[datasourceName].geojsonIndexes = state.geocoding[datasourceName].geojsonIndexes.sort((l, r) => l - r)
                .filter((i, n, a) => 0 === n || i !== a[n - 1])
            state.geocoding[datasourceName].distantGeojsonIndexes = state.geocoding[datasourceName].distantGeojsonIndexes.sort((l, r) => l - r)
                .filter((i, n, a) => (0 === n || i !== a[n - 1]) && !state.geocoding[datasourceName].geojsonIndexes.includes(i))
            statusCounts = {
                ...statusCounts,
                states: statusCounts.states + 1
            }
            logProgress(sourcePath.slice(0, 2), totalCities, true)
        })
        const bestIndex = findBestGeojsonIndex(country.lat, country.lon, datasourcedIndexedGeojson, maxMilesDistance)
        if (undefined !== bestIndex && [bestIndex.geojsonIndex, bestIndex.distantGeojsonIndex].some(v => undefined !== v)) {
            counts = {
                ...counts,
                geocodedCountries: counts.geocodedCountries + 1
            }
            if (undefined !== bestIndex.geojsonIndex) {
                country.geocoding[datasourceName].geojsonIndexes.push(bestIndex.geojsonIndex)
                requiredGeojsonIndexes.push(bestIndex.geojsonIndex)
            }
            if (undefined !== bestIndex.distantGeojsonIndex) {
                country.geocoding[datasourceName].distantGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
                requiredGeojsonIndexes.push(bestIndex.distantGeojsonIndex)
            }
        }
        country.geocoding[datasourceName].geojsonIndexes = country.geocoding[datasourceName].geojsonIndexes.sort((l, r) => l - r)
            .filter((i, n, a) => 0 === n || i !== a[n - 1])
        country.geocoding[datasourceName].distantGeojsonIndexes = country.geocoding[datasourceName].distantGeojsonIndexes.sort((l, r) => l - r)
            .filter((i, n, a) => (0 === n || i !== a[n - 1]) && !country.geocoding[datasourceName].geojsonIndexes.includes(i))
        statusCounts = {
            ...statusCounts,
            countries: statusCounts.countries + 1
        }
        logProgress(sourcePath.slice(0, 1), totalCities, true)
    })
    const result = {
        geocodedCountryStateCityMap: countryStateCityMap,
        requiredGeojsonIndexes: requiredGeojsonIndexes.sort((l, r) => l - r).filter((v, i, a) => 0 === i || v != a[i - 1]),
    }
    console.log(`${indent}done! Geocoded (${counts.geocodedCountries}/${statusCounts.countries} countries, ${counts.geocodedStates}/${statusCounts.states} states, and ${counts.geocodedCities}/${statusCounts.cities} cities) ${result.requiredGeojsonIndexes.length}/${indexedGeojson.length} ${datasourceName} geojsonIndices. (${durationToString(Date.now() - tstart)})`)
    return result

}

export const GeocodeGenerator = (
    countryDataInput,
    geoDataInput,
) => {
    const countryStateCityGenerator = CountryStateCityMapGenerator(countryDataInput)
    const geoDataOutput = GeoDataOutput(geoDataInput)
    const removeFiles = async (indent = '') => {
        const tstart = Date.now()
        let count = 0
        console.log(`${indent}Removing ${geoDataOutput.datasourceName} generated files`)
        for (const file of (await fs.promises.readdir(geoDataOutput.geojsonOutputDirpath)).filter(f => f.startsWith(geoDataOutput.datasourceName))) {
            count = count + 1
            await fs.promises.rm(Path.join(geoDataOutput.geojsonOutputDirpath, file))
        }
        console.log(`${indent}done! ${count} files removed. duration: ${durationToString(Date.now() - tstart)}`)
    }

    const loadDatasourcedIndexedGeojson = async (indent = '') => {
        const tstart = Date.now()
        console.log(`${indent}Loading and indexing ${Path.basename(geoDataInput.shapeFilepath)} shapeData as GeoJson `)
        const shpData = await fs.promises.readFile(geoDataInput.shapeFilepath);
        const geojson = await shp(geoDataInput.shapeFilepath.endsWith('.shp') ? { shp: shpData } : shpData)
        await fs.promises.writeFile(`${geoDataInput.shapeFilepath}.geo.json`, JSON.stringify(geojson), 'utf8')
        const indexedGeojson = geojsonToIndexedGeojson(geojson)
        await fs.promises.writeFile(`${geoDataInput.shapeFilepath}.indexed.geo.json`, JSON.stringify(indexedGeojson), 'utf8')
        console.log(`${indent}done! ${geoDataInput.datasourceName} has ${indexedGeojson.length} geojson indices. (${durationToString(Date.now() - tstart)})`)
        return {
            datasourceName: geoDataInput.datasourceName,
            indexedGeojson,
        }
    }

    const writeIndexedGeojsonFiles = async (datasourcedIndexedGeojson, indexesToWrite, indent = '') => {
        let tstart = Date.now()
        const indexes = [...indexesToWrite].sort((l, r) => l - r)
        console.log(`${indent}Writing required Geojson Indexes (${indexesToWrite.length}/${datasourcedIndexedGeojson.indexedGeojson.length}) to ${geoDataOutput.toGeojsonIndexFilepath('<index>')}`)
        for (const index of indexes) {
            await fs.promises.writeFile(geoDataOutput.toGeojsonIndexFilepath(index), JSON.stringify(datasourcedIndexedGeojson.indexedGeojson[index]), 'utf8')
        }
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }
    async function exists(indexes) {
        if (0 === indexes.length) return false
        const { prefix, suffix } = geoDataOutput.geojsonIndexFilenameParts
        const fileIndexes = (await fs.promises.readdir(geoDataOutput.geojsonOutputDirpath))
            .filter(file => file.startsWith(prefix) && file.endsWith(suffix))
            .map(name => {
                const startPos = prefix.length
                const endPos = name.length - suffix.length
                const result = parseInt(name.substring(startPos, endPos))
                if (Number.isNaN(result)) {
                    console.log(`${name} not indexed by ${name.substring(startPos, endPos)}`)
                    return undefined
                }
                return result
            })
            .filter(v => undefined !== v)
        if (fileIndexes.length !== indexes.length) {
            console.log(`${geoDataInput.datasourceName}> ${fileIndexes.length} != expected ${indexes.length}`)
            return false
        }
        if (!indexes.every(i => fileIndexes.includes(i))) {
            console.log(`${geoDataInput.datasourceName}> Not all indexes match [${indexes.filter(i => !fileIndexes.includes(i)).join(',')}]`)
            return false
        }
        return true
    }

    const generate = async (maxMilesDistance, regionFilter, indent = '') => {
        const tstart = Date.now()
        console.log(`${indent}Geocoding World Country-State-City Map within ${maxMilesDistance} miles of regions [${regionFilter.join(', ')}] in ${geoDataInput.datasourceName} geodata`)

        const CountryStateCityMap = await countryStateCityGenerator.loadGeocodedMap(`${indent}\t`)

        const geojsonIndexes = sortFilterIndexes(Object.values(CountryStateCityMap)
            .map(country => getRequiredGeojsonIndexes(country, geoDataInput.datasourceName)).flat())
        if (await exists(sortFilterIndexes(geojsonIndexes))) {
            console.log(`${indent} - skipping, already geocoded.`)
            return
        }
        await removeFiles(`${indent}\t`)


        const countryStateMapFilter = createCountryStateCitiesMapFilter(regionFilter, geoDataInput.regionIsoCodeMap, `${indent}\t`)
        const datasourcedIndexedGeojson = await loadDatasourcedIndexedGeojson(`${indent}\t`)

        const { geocodedCountryStateCityMap, requiredGeojsonIndexes } = geocodeCountryStateCityMap(
            CountryStateCityMap, countryStateMapFilter, datasourcedIndexedGeojson, maxMilesDistance, `${indent}\t`)

        await countryStateCityGenerator.writeGeocodedMap(geocodedCountryStateCityMap, `${indent}\t`)
        await writeIndexedGeojsonFiles(datasourcedIndexedGeojson, requiredGeojsonIndexes, `${indent}\t`)

        const durationms = Date.now() - tstart
        console.log(`${indent}done! duration: ${durationToString(durationms)}`)

    }

    return {
        generate
    }
}