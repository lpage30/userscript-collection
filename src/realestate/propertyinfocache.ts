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

const MaxDataAgems = 30 * ONE_MINUTE

interface CachedData {
    timestamp: number,
    serializedData: string
}
async function cacheIndividualProperties(source: string, properties: PropertyInfo[]): Promise<void> {
    for (const property of properties) {
        const pageUrl = property.href('')
        await cacheProperties(source, pageUrl, [property])
    }
}
export async function cacheProperties(source: string, pageUrl: string, properties: PropertyInfo[]): Promise<void> {
    const cacheData: CachedData = {
        timestamp: Date.now(),
        serializedData: serializeProperties(properties)
    }
    const cacheKey = `${source}.${toHashCode(pageUrl)}`
    await IndexedDB_GM_setValue(cacheKey, cacheData)
    if (1 < properties.length || (1 == properties.length && pageUrl !== properties[0].href(''))) {
        cacheIndividualProperties(source, properties)
    }

}

export async function getCachedProperties(source: string, pageUrl: string): Promise<PropertyInfo[]> {
    const cacheKey = `${source}.${toHashCode(pageUrl)}`
    const cacheData: CachedData | undefined = await IndexedDB_GM_getValue(cacheKey)
    if ([undefined, null].includes(cacheData)) {
        return []
    }
    if (MaxDataAgems <= (Date.now() - cacheData.timestamp)) {
        await IndexedDB_GM_deleteValue(cacheKey)
        return []
    }
    return deserializeProperties(cacheData.serializedData)
}

export async function cacheWrapper(source: string, pageUrl: string, collectData: () => Promise<PropertyInfo[]>): Promise<PropertyInfo[]> {
    const cachedProperties = await getCachedProperties(source, pageUrl)
    if (0 === cachedProperties.length) {
        const properties = await collectData()
        await cacheProperties(source, pageUrl, properties)
        return properties
    }
    return cachedProperties
}