import { GeojsonIndex, GeodataSourceType } from './datatypes'
import { MultiLineString, Feature } from 'geojson'
import { ONE_MINUTE } from '../common/datetime'
import * as turf from '@turf/turf'
import {
    getTl2025UsCoastlineGeojsonIndex,
    getUkcp18UkMarineCoastlineHiresGeojsonIndex
} from './generated_registered_geojson_data_functions'

function getGeojsonIndex(geodataSource: GeodataSourceType, index: number): Promise<GeojsonIndex> {
    if ('tl_2025_us_coastline' === geodataSource) return getTl2025UsCoastlineGeojsonIndex(index)
    if ('ukcp18_uk_marine_coastline_hires' === geodataSource) return getUkcp18UkMarineCoastlineHiresGeojsonIndex(index)
}

function toMultilineString(indices: GeojsonIndex[]): Feature<MultiLineString> {
    const coordinates = indices.map(({ lineString }) => lineString.geometry.coordinates)
    return turf.multiLineString(coordinates)
}
type IndexCacheBlock = {
    geojsonIndex: GeojsonIndex,
    evictionTimeout: NodeJS.Timeout,
}
type MultilineCacheBlock = {
    multilineString: Feature<MultiLineString>,
    evictionTimeout: NodeJS.Timeout,
}

class GeojsonIndexCache {
    private indexCache: {
        tl_2025_us_coastline: {
            [index: number]: IndexCacheBlock
        },
        ukcp18_uk_marine_coastline_hires: {
            [index: number]: IndexCacheBlock
        }
    }
    private multilineStringCache: {
        tl_2025_us_coastline: {
            [indexcsv: string]: MultilineCacheBlock
        }
        ukcp18_uk_marine_coastline_hires: {
            [indexcsv: string]: MultilineCacheBlock
        }
    }
    private maxAgeMs: number
    constructor(maxAgeMs: number) {
        this.indexCache = {
            tl_2025_us_coastline: {},
            ukcp18_uk_marine_coastline_hires: {}
        }
        this.multilineStringCache = {
            tl_2025_us_coastline: {},
            ukcp18_uk_marine_coastline_hires: {}
        }
        this.maxAgeMs = maxAgeMs
    }

    async loadIndex(geodataSource: GeodataSourceType, index: number): Promise<GeojsonIndex> {
        let result: IndexCacheBlock = this.indexCache[geodataSource][index]
        if (result) {
            clearTimeout(result.evictionTimeout)
        } else {
            const geojsonIndex = await getGeojsonIndex(geodataSource, index)
            result = {
                geojsonIndex,
                evictionTimeout: undefined,
            }
            this.indexCache[geodataSource][index] = result
        }
        result.evictionTimeout = setTimeout(() => {
            delete this.indexCache[geodataSource][index]
        }, this.maxAgeMs)
        return result.geojsonIndex
    }
    async loadIndicies(geodataSource: GeodataSourceType, indices: number[]): Promise<GeojsonIndex[]> {
        const result: GeojsonIndex[] = []
        for (const index of indices) {
            result.push(await this.loadIndex(geodataSource, index))
        }
        return result
    }
    async loadMultlineString(geodataSource: GeodataSourceType, indices: number[]): Promise<Feature<MultiLineString>> {
        const indexcsv = indices.sort().join(',')
        let result: MultilineCacheBlock = this.multilineStringCache[geodataSource][indexcsv]
        if (result) {
            clearTimeout(result.evictionTimeout)
        } else {
            const multilineString = toMultilineString(await this.loadIndicies(geodataSource, indices))
            result = {
                multilineString,
                evictionTimeout: undefined,
            }
            this.multilineStringCache[geodataSource][indexcsv] = result
        }
        result.evictionTimeout = setTimeout(() => {
            delete this.multilineStringCache[geodataSource][indexcsv]
        }, this.maxAgeMs)
        return result.multilineString
    }
}
const geojsonIndexCache = new GeojsonIndexCache(ONE_MINUTE)

export const loadGeoJsonIndex = async (geodataSource: GeodataSourceType, index: number) => geojsonIndexCache.loadIndex(geodataSource, index)
export const loadMultilineString = async (geodataSource: GeodataSourceType, indices: number[]) => geojsonIndexCache.loadMultlineString(geodataSource, indices)