import { GeojsonIndex } from './datatypes'
import { MultiLineString, Feature } from 'geojson'
import { ONE_MINUTE } from '../common/datetime'
import * as turf from '@turf/turf'
import getTl2025UsCoastlineGeojsonIndex from './generated_tl_2025_us_coastline'

function toMultilineString(indices: GeojsonIndex[]): Feature<MultiLineString> {
    const coordinates = indices.map(({lineString}) => lineString.geometry.coordinates)
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
        [index: number]: IndexCacheBlock
    }
    private multilineStringCache: {
        [indexcsv: string]: MultilineCacheBlock
    }
    private maxAgeMs: number
    constructor(maxAgeMs) {
        this.indexCache = {}
        this.multilineStringCache = {}
        this.maxAgeMs = maxAgeMs
    }
    async loadIndex(index: number): Promise<GeojsonIndex> {
        let result: IndexCacheBlock = this.indexCache[index]
        if(result) {
            clearTimeout(result.evictionTimeout)
        } else {
            const geojsonIndex = getTl2025UsCoastlineGeojsonIndex(index)
            result = {
                geojsonIndex,
                evictionTimeout: undefined,
            }
            this.indexCache[index] = result
        }
        result.evictionTimeout = setTimeout(() => {
            delete this.indexCache[index]
        }, this.maxAgeMs)
        return result.geojsonIndex
    }
    async loadIndicies(indices: number[]): Promise<GeojsonIndex[]> {
        const result: GeojsonIndex[] = []
        for (const index of indices) {
            result.push(await this.loadIndex(index))
        }
        return result
    }
    async loadMultlineString(indices: number[]): Promise<Feature<MultiLineString>> {
        const indexcsv = indices.sort().join(',')
        let result: MultilineCacheBlock = this.multilineStringCache[indexcsv]
        if(result) {
            clearTimeout(result.evictionTimeout)
        } else {
            const multilineString = toMultilineString(await this.loadIndicies(indices))
            result = {
                multilineString,
                evictionTimeout: undefined,
            }
            this.multilineStringCache[indexcsv] = result
        }
        result.evictionTimeout = setTimeout(() => {
            delete this.multilineStringCache[indexcsv]
        }, this.maxAgeMs)
        return result.multilineString
    }
}
const geojsonIndexCache = new GeojsonIndexCache(ONE_MINUTE)

export const loadGeoJsonIndex = async (index: number) => geojsonIndexCache.loadIndex(index)
export const loadMultilineString = async (indices: number[]) => geojsonIndexCache.loadMultlineString(indices)