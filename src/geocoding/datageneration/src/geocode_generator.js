import { Country, State, City } from 'country-state-city'
import * as turf from '@turf/turf'
import shp from 'shpjs'
import Path from 'path'
import fs from 'fs'
import { durationToString, toJsonFilename, toTitleCase } from './functions.js'
import { createCountryStateMapFilter } from './region_filter.js'
import { CountryStateCityMapGenerator } from './countrystatecitymap_generator.js'

function pass1GeocodeCountryStateCityMap(countryStateCityMap, countryStateCityMapGeocodeFilter, indexedGeojson, indent = '') {
    const tstart = Date.now()
    const findGeoJsonSection = (lat, lon, sourceName) => {
        if ([lat, lon].some(v => null == v || undefined == v || isNaN(v))) return undefined
        try {
            const source = turf.point([lon, lat])
            return indexedGeojson.find(data =>
                turf.booleanPointInPolygon(source, data.polygon)
            )
        } catch (e) {
            throw new Error(`Failed Find: ${sourceName}@lat(${lat})lon(${lon}). ${e}`)
        }
    }
    console.log(`${indent}Pass 1: initial geocoding Country/State/City map`)
    const counts = {
        country: 0,
        state: 0,
        city: 0,
    }
    const requiredGeojsonIndexes = []
    Object.entries(countryStateCityMapGeocodeFilter).forEach(([countryCode, stateCodes]) => {
        const country = Country.getCountryByCode(countryCode)
        const states = stateCodes.map(stateCode => State.getStateByCodeAndCountry(stateCode, countryCode))
        const sourceName = [`Country(${country.name})`, '', '']
        const countryGeojsonindexes = []

        states.forEach(state => {
            sourceName[1] = `State(${state.name})`
            const stateGeojsonIndexes = []
            Object.values(countryStateCityMap[country.name].states[state.name].cities).forEach(city => {
                sourceName[2] = `City(${city.name})`
                const geojsonSection = findGeoJsonSection(city.lat, city.lon, sourceName.join('.'))
                if (geojsonSection) {
                    counts.city = counts.city + 1
                    countryStateCityMap[country.name].states[state.name].cities[city.name].geojsonIndexes.push(geojsonSection.index)
                    stateGeojsonIndexes.push(geojsonSection.index)
                }
            })
            const geojsonSection = findGeoJsonSection(state.lat, state.lon, sourceName.slice(0, 2).join('.'))
            const geojsonIndexes = (geojsonSection ? [...stateGeojsonIndexes, geojsonSection.index] : stateGeojsonIndexes).sort().filter((v, i, a) => 0 === i || v != a[i - 1])
            if (0 < geojsonIndexes.length) {
                counts.state = counts.state + 1
                countryStateCityMap[country.name].states[state.name].geojsonIndexes.push(...geojsonIndexes)
                countryGeojsonindexes.push(...geojsonIndexes)
            }
        })
        const geojsonSection = findGeoJsonSection(country.lat, country.lon, sourceName[0])
        const geojsonIndexes = (geojsonSection ? [...countryGeojsonindexes, geojsonSection.index] : countryGeojsonindexes).sort().filter((v, i, a) => 0 === i || v != a[i - 1])
        if (0 < geojsonIndexes.length) {
            counts.country = counts.country + 1
            countryStateCityMap[country.name].geojsonIndexes.push(...geojsonIndexes)
            requiredGeojsonIndexes.push(...geojsonIndexes)
        }
    })
    const result = {
        geocodedCountryStateCityMap: countryStateCityMap,
        requiredGeojsonIndexes: requiredGeojsonIndexes.sort().filter((v, i, a) => 0 === i || v != a[i - 1]),
    }
    console.log(`${indent}done! Geocoded (${counts.country} countries, ${counts.state} states, and ${counts.city} cities) ${result.requiredGeojsonIndexes.length}/${indexedGeojson.length} geojsonIndices. (${durationToString(Date.now() - tstart)})`)
    return result
}

function pass2GeocodeCountryStateCityMap(geocodedCountryStateCityMap, countryStateCityMapGeocodeFilter, requiredGeojsonIndexes, indexedGeojson, maxMilesDistance, indent = '') {
    const tstart = Date.now()
    const findDistantGeoJsonSection = (lat, lon, maxDistance, sourceName, indexFilter) => {
        if ([lat, lon].some(v => null == v || undefined == v || isNaN(v))) return undefined
        try {
            const source = turf.point([lon, lat])
            const section = indexedGeojson.filter(({ index }) => 0 === indexFilter.length || indexFilter.includes(index)).reduce((minDistanceIndex, data) => {

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
            return section.data
        } catch (e) {
            throw new Error(`Failed Find: ${sourceName}@lat(${lat})lon(${lon}). ${e}`)
        }
    }
    console.log(`${indent}Pass 2: Geocoding Country/State/City map for any remaining un-geocoded data <= ${maxMilesDistance} miles from geojson`)
    const counts = {
        country: 0,
        state: 0,
        city: 0,
    }
    const initialRequiredCount = requiredGeojsonIndexes.length
    const finalRequiredGeojsonIndexes = [...requiredGeojsonIndexes]
    Object.entries(countryStateCityMapGeocodeFilter).forEach(([countryCode, stateCodes]) => {
        const country = Country.getCountryByCode(countryCode)
        const states = stateCodes.map(stateCode => State.getStateByCodeAndCountry(stateCode, countryCode))
        const sourceName = [`Country(${country.name})`, '', '']
        const countryDistantGeojsonIndexes = []

        states.forEach(state => {
            const stateDistantGeojsonIndexes = []
            Object.values(geocodedCountryStateCityMap[country.name].states[state.name].cities).forEach(city => {
                if (0 < geocodedCountryStateCityMap[country.name].states[state.name].cities[city.name].geojsonIndexes.length) {
                    return
                }
                sourceName[2] = `City(${city.name})`
                const distantGeojsonSection = findDistantGeoJsonSection(city.lat, city.lon, city.distantMaxMiles, sourceName.join('.'), geocodedCountryStateCityMap[country.name].states[state.name].geojsonIndexes)
                if (distantGeojsonSection) {
                    counts.city = counts.city + 1
                    const distantGeojsonIndexes = distantGeojsonSection ? [distantGeojsonSection.index] : []
                    geocodedCountryStateCityMap[country.name].states[state.name].cities[city.name].distantGeojsonIndexes.push(...distantGeojsonIndexes)
                    stateDistantGeojsonIndexes.push(...distantGeojsonIndexes)

                }
            })
            sourceName[1] = `State(${state.name})`
            const distantGeojsonSection = findDistantGeoJsonSection(state.lat, state.lon, state.distantMaxMiles, sourceName.slice(0, 2).join('.'), geocodedCountryStateCityMap[country.name].geojsonIndexes)
            const distantGeojsonIndexes = (distantGeojsonSection ? [...stateDistantGeojsonIndexes, distantGeojsonSection.index] : stateDistantGeojsonIndexes)
                .sort()
                .filter((v, i, a) => 0 === i || v != a[i - 1])
                .filter(v => !geocodedCountryStateCityMap[country.name].states[state.name].geojsonIndexes.includes(v))
            if (0 < distantGeojsonIndexes.length) {
                counts.state = counts.state + 1
                geocodedCountryStateCityMap[country.name].states[state.name].distantGeojsonIndexes.push(...distantGeojsonIndexes)
                countryDistantGeojsonIndexes.push(...distantGeojsonIndexes)
            }
        })
        const distantGeojsonSection = findDistantGeoJsonSection(country.lat, country.lon, country.distantMaxMiles, sourceName[0], [])
        const distantGeojsonIndexes = (distantGeojsonSection ? [...countryDistantGeojsonIndexes, distantGeojsonSection.index] : countryDistantGeojsonIndexes)
            .sort()
            .filter((v, i, a) => 0 === i || v != a[i - 1])
            .filter(v => !geocodedCountryStateCityMap[country.name].geojsonIndexes.includes(v))
        if (0 < distantGeojsonIndexes.length) {
            counts.country = counts.country + 1
            geocodedCountryStateCityMap[country.name].distantGeojsonIndexes.push(...distantGeojsonIndexes)
            finalRequiredGeojsonIndexes.push(...distantGeojsonIndexes)
        }
    })
    const result = {
        geocodedCountryStateCityMap,
        requiredGeojsonIndexes: finalRequiredGeojsonIndexes.sort().filter((v, i, a) => 0 === i || v != a[i - 1]),
    }
    console.log(`${indent}done! ${maxMilesDistance} mile radius geocoded additional: ${counts.country} countries, ${counts.state} states, and ${counts.city} cities; added ${result.requiredGeojsonIndexes.length - initialRequiredCount}/${indexedGeojson.length} more geojsonIndices (${durationToString(Date.now() - tstart)})`)
    return result
}

function geocodeCountryStateCityMap(countryStateCityMap, countryStateCityMapGeocodeFilter, indexedGeojson, maxMilesDistance, indent = '') {
    const tstart = Date.now()
    console.log(`${indent}Geocoding Country/State/City within ${maxMilesDistance} of indexed Geojson`)
    const pass1 = pass1GeocodeCountryStateCityMap(countryStateCityMap, countryStateCityMapGeocodeFilter, indexedGeojson, `${indent}\t`)
    const result = pass2GeocodeCountryStateCityMap(pass1.geocodedCountryStateCityMap, countryStateCityMapGeocodeFilter, pass1.requiredGeojsonIndexes, indexedGeojson, maxMilesDistance, `${indent}\t`)
    console.log(`${indent}done! Geocoding complete (${durationToString(Date.now() - tstart)})`)
    return result
}


export const GeocodeGenerator = (
    geocodingDirname,
    shapefilenamePrefix,
    regionIsoCodeMap,
) => {
    if (!fs.existsSync(geocodingDirname)) {
        throw new Error(`GeocodeGenerator: directory ${geocodingDirname} does not exist`)
    }
    const countryStateCityGenerator = CountryStateCityMapGenerator(geocodingDirname)
    const geodataDirpath = Path.join(geocodingDirname,'datageneration', 'geodata')
    const geojsonDataDirname = 'geojsondata'
    const geojsonDataDirpath = Path.join(geocodingDirname, geojsonDataDirname)
    const toGeojsonFilenamePrefix = (index) => `${shapefilenamePrefix}_${index}`
    const toGeojsonFilepath = (index) => Path.join(geojsonDataDirpath, `${toGeojsonFilenamePrefix(index)}.json`)
    const toGeojsonImportpath = (index) => `./${geojsonDataDirname}/${toGeojsonFilenamePrefix(index)}.json`
    const shapefilename = `${shapefilenamePrefix}.zip`
    const shapefilepath = Path.join(geodataDirpath, shapefilename)

    const tsfilename = `generated_${shapefilenamePrefix}.ts`
    const tsfilepath = Path.join(geocodingDirname, tsfilename)
    const geodataName = toTitleCase(shapefilenamePrefix)

    const removeFiles = async (indent = '') => {
        const tstart = Date.now()
        let count = 0
        console.log(`${indent}Removing ${shapefilenamePrefix} generated files`)
        for (const file of (await fs.promises.readdir(geojsonDataDirpath)).filter(f => f.startsWith(shapefilenamePrefix))) {
            count = count + 1
            await fs.promises.rm(Path.join(geojsonDataDirpath, file))
        }
        if (fs.existsSync(tsfilepath)) {
            count = count + 1
            await fs.promises.rm(tsfilepath)
        }
        console.log(`${indent}done! ${count} files removed. duration: ${durationToString(Date.now() - tstart)}`)
    }

    const loadAndIndexShapefile = async (indent = '') => {
        const tstart = Date.now()
        console.log(`${indent}Loading and indexing ${Path.basename(shapefilepath)} shapeData as GeoJson `)
        const shpData = await fs.promises.readFile(shapefilepath);
        const geojson = await shp(shpData)
        const indexedGeojson = geojson.features
            .filter(feature => feature.geometry && feature.geometry.type === 'LineString')
            .map((feature, index) => ({
                index,
                lineString: turf.lineString(feature.geometry.coordinates),
                polygon: turf.bboxPolygon(feature.geometry.bbox)
            }))
        console.log(`${indent}done! ${indexedGeojson.length} geojson indices. (${durationToString(Date.now() - tstart)})`)
        return indexedGeojson
    }

    const writeIndexedGeojsonFiles = async (indexedGeojson, indexesToWrite, indent = '') => {
        let tstart = Date.now()
        const indexes = [...indexesToWrite].sort((l, r) => l - r)
        console.log(`${indent}Writing required Geojson Indexes (${indexesToWrite.length}/${indexedGeojson.length}) to ${toGeojsonFilepath('<index>')}`)
        for (const index of indexes) {
            await fs.promises.writeFile(toGeojsonFilepath(index), JSON.stringify(indexedGeojson[index]), 'utf8')
        }
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
        tstart = Date.now()
        console.log(`${indent}Generating/Writing ${tsfilepath} with get${geodataName}GeojsonIndex(index: number): any default export`)
        const importLines = indexes.map(index => `import ${toGeojsonFilenamePrefix(index)} from '${toGeojsonImportpath(index)}'`)
        const geojsonTypescript = `${importLines.join('\n')}

const ${geodataName}Map: { [index: number]: any } = {
${indexes.map(index => `    [${index}]: ${toGeojsonFilenamePrefix(index)}`).join(',\n')}
}

export default function get${geodataName}GeojsonIndex(index: number): any { return ${geodataName}Map[index] }
`
        await fs.promises.writeFile(tsfilepath, geojsonTypescript, 'utf8')
        console.log(`${indent}done! duration: ${durationToString(Date.now() - tstart)}`)
    }


    const generate = async (maxMilesDistance, regionFilter, indent = '') => {
        const tstart = Date.now()

        if (!fs.existsSync(shapefilepath)) {
            throw new Error(`GeocodeGenerator: shapefile ${shapefilepath} does not exist`)
        }
        console.log(`${indent}Geocoding World Country-State-City Map within ${maxMilesDistance} miles of regions [${regionFilter.join(', ')}] in ${geodataName} geodata`)
        if (fs.existsSync(tsfilepath)) {
            console.log(`${indent}- skipping, already generated.`)
            return
        }
        const CountryStateCityMap = await countryStateCityGenerator.loadMap(`${indent}\t`)
        await removeFiles(`${indent}\t`)


        const countryStateMapFilter = createCountryStateMapFilter(regionFilter, regionIsoCodeMap, `${indent}\t`)
        const indexedGeojson = await loadAndIndexShapefile(`${indent}\t`)

        const { geocodedCountryStateCityMap, requiredGeojsonIndexes } = geocodeCountryStateCityMap(CountryStateCityMap, countryStateMapFilter, indexedGeojson, maxMilesDistance, `${indent}\t`)

        await countryStateCityGenerator.writeMap(geocodedCountryStateCityMap, `${indent}\t`)
        await writeIndexedGeojsonFiles(indexedGeojson, requiredGeojsonIndexes, `${indent}\t`)

        const durationms = Date.now() - tstart
        console.log(`${indent}done! duration: ${durationToString(durationms)}`)

    }

    return {
        generate
    }
}