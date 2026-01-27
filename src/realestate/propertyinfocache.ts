import {
    IndexedDB_GM_getValue,
    IndexedDB_GM_setValue,
    IndexedDB_GM_deleteValue
} from '../common/indexed_db_gmvalues';
import { toHashCode } from '../common/functions';
import { ONE_MINUTE } from '../common/datetime';
import { PropertyInfo } from './propertyinfotypes';
import {
    serializeProperties,
    deserializeProperties
} from './serialize_deserialize_functions';
import { GeocodedScrapedProperties } from './realestatesitetypes';

const MaxDataAgems = 30 * ONE_MINUTE

interface CachedData {
    timestamp: number
    serializedData: string
    containsOlderResults: boolean
}
async function cacheIndividualProperties(source: string, properties: PropertyInfo[]): Promise<void> {
    for (const property of properties) {
        const pageUrl = property.href('')
        await cacheProperties(source, pageUrl, { properties: [property], containsOlderResults: false })
    }
}
export async function cacheProperties(source: string, pageUrl: string, cacheProperties: GeocodedScrapedProperties): Promise<void> {
    const { properties, containsOlderResults } = cacheProperties
    const cacheData: CachedData = {
        timestamp: Date.now(),
        serializedData: serializeProperties(properties),
        containsOlderResults,
    }
    const cacheKey = `${source}.${toHashCode(pageUrl)}`
    await IndexedDB_GM_setValue(cacheKey, cacheData)
    if (1 < properties.length || (1 == properties.length && pageUrl !== properties[0].href(''))) {
        cacheIndividualProperties(source, properties)
    }

}

export async function getCachedProperties(source: string, pageUrl: string): Promise<GeocodedScrapedProperties> {
    const cacheKey = `${source}.${toHashCode(pageUrl)}`
    const cacheData: CachedData | undefined = await IndexedDB_GM_getValue(cacheKey)
    if ([undefined, null].includes(cacheData)) {
        return { properties: [], containsOlderResults: true }
    }
    if (MaxDataAgems <= (Date.now() - cacheData.timestamp)) {
        await IndexedDB_GM_deleteValue(cacheKey)
        return { properties: [], containsOlderResults: true }
    }
    return {
        properties: deserializeProperties(cacheData.serializedData),
        containsOlderResults: cacheData.containsOlderResults
    }
}
export async function cacheWrapper(source: string, pageUrl: string, collectData: () => Promise<GeocodedScrapedProperties>, force: boolean): Promise<GeocodedScrapedProperties> {
    const skipCacheRead = undefined !== force && force === true
    let cacheableProperties: GeocodedScrapedProperties = skipCacheRead
        ? { properties: [], containsOlderResults: false }
        : await getCachedProperties(source, pageUrl)
    if (0 === cacheableProperties.properties.length) { // cache-miss or force == true
        cacheableProperties = await collectData()
        await cacheProperties(source, pageUrl, cacheableProperties)
    }
    return cacheableProperties
}