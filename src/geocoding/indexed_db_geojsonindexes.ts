import { getGeoIndexedDB } from './geo_indexed_db'
import { GeojsonIndex, GeodataSourceType } from './datatypes'

export async function getGeoJsonIndex(source: GeodataSourceType, index: number): Promise<GeojsonIndex | undefined> {
    const key = `${source}.${index}`
    const result = await (await getGeoIndexedDB('GeoIndexes')).getValue(key)

    return result ? JSON.parse(result) as GeojsonIndex : undefined
}

export async function setGeoJsonIndex(source: GeodataSourceType, index: number, geojsonindex: string): Promise<void> {
    const key = `${source}.${index}`
    await (await getGeoIndexedDB('GeoIndexes')).setValue(key, geojsonindex)
}