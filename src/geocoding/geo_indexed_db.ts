// @grant    GM_info
import { IndexedDB, openIndexedDB } from "../common/indexed_db";
import { ONE_YEAR } from "../common/datetime";

let GeoIndexedDB: IndexedDB = undefined

export async function getGeoIndexedDB(type: 'Country' | 'GeocodedCountryExtension' | 'GeoIndexes'): Promise<IndexedDB> {
    if (undefined === GeoIndexedDB) {
        GeoIndexedDB = await openIndexedDB(`${GM_info.script.name}-Geocoding`, type, 2 * ONE_YEAR)
    }
    return GeoIndexedDB
}
