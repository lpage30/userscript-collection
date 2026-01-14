// @grant    GM_info
import { openDB } from 'idb'

const GMValuesStore = 'GM-Values'
const IndexedDBGMValues = openDB(GM_info.script.name, 1, {
    upgrade(db) {
        db.createObjectStore(GMValuesStore)
    }
})

export async function IndexedDB_GM_setValue(name: string, value: any): Promise<void> {
    try {
        await (await IndexedDBGMValues).put(GMValuesStore, value, name)
    } catch (e) {
        console.error(`IndexedDB_GM_setValue(${name}) Failed.`, e)
        throw e
    }
}

export async function IndexedDB_GM_getValue(name: string, defaultValue?: any): Promise<any> {
    try {
        const result = await (await IndexedDBGMValues).get(GMValuesStore, name)
        return result ? result : defaultValue
    } catch (e) {
        console.error(`IndexedDB_GM_getValue(${name}) Failed.`, e)
        throw e
    }
}

export async function IndexedDB_GM_deleteValue(name: string): Promise<void> {
    try {
        await (await IndexedDBGMValues).delete(GMValuesStore, name)
    } catch (e) {
        console.error(`IndexedDB_GM_deleteValue(${name}) Failed.`, e)
        throw e
    }
}
