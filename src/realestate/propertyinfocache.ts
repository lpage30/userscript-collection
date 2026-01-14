// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
import { ONE_MINUTE } from '../common/datetime';
import { GeoPropertyInfo } from './propertyinfotypes';
import {
    serializeGeocoding,
    deserializeGeocoding,
} from './propertyinfotype_functions';

const MaxDataAgems = 30 * ONE_MINUTE

interface CacheProperties {
    timestamp: number,
    serializedProperties: string
}
interface CachedGeoPropertyInfo {
    timestamp: number,
    serializedGeoPropertyInfo: string
}
export function cacheGeoPropertyInfo(source: string, elementId: string, geoPropertyInfo: GeoPropertyInfo, reportProgress?: (progress: string) => void): void {
    return
    const now = Date.now()
    const key = `${source}.${elementId}.geoPropertyInfo`
    const serializedGeoPropertyInfo = serializeGeocoding(geoPropertyInfo)
    const data: CachedGeoPropertyInfo = {
        timestamp: now,
        serializedGeoPropertyInfo,
    }
    if (reportProgress) reportProgress(`Caching ${serializedGeoPropertyInfo.length} bytes`)
    try {
        GM_setValue(key, data)
        if (reportProgress) reportProgress(`Cached ${serializedGeoPropertyInfo.length} GeoPropertyInfo`)
    } catch (e) {
        console.error(`Failred writing to ${key}`, e)
    }
}

export function getCachedGeoPropertyInfo(source: string, elementId: string, reportProgress?: (progress: string) => void): GeoPropertyInfo | undefined {
    return undefined
    const now = Date.now()
    const key = `${source}.${elementId}.geoPropertyInfo`
    const dataString: string | undefined | null = GM_getValue(key)
    if ([undefined, null].includes(dataString)) {
        return undefined
    }
    const data: CachedGeoPropertyInfo = JSON.parse(dataString)
    if (MaxDataAgems <= (now - data.timestamp)) {
        GM_deleteValue(key)
        return undefined
    }
    const deserializedGeoPropertyInfo = deserializeGeocoding(data.serializedGeoPropertyInfo)
    if (reportProgress) reportProgress(`Cache hit ${source} ${elementId} GeoPropertyInfo`)
    return deserializedGeoPropertyInfo
}
