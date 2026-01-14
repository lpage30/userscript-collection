import { openGMScriptIndexedDB, IndexedDB } from './indexed_db'

let IndexedDBGMValues: IndexedDB = undefined
async function getIndexedDBGMValues(): Promise<IndexedDB> {
    if (undefined === IndexedDBGMValues) {
        IndexedDBGMValues = await openGMScriptIndexedDB('GM-Values')
    }
    return IndexedDBGMValues
}

export async function IndexedDB_GM_setValue(name: string, value: any): Promise<void> {
    return (await getIndexedDBGMValues()).setValue(name, value)
}

export async function IndexedDB_GM_getValue(name: string, defaultValue?: any): Promise<any> {
    return (await getIndexedDBGMValues()).getValue(name, defaultValue)
}

export async function IndexedDB_GM_deleteValue(name: string): Promise<void> {
    return (await getIndexedDBGMValues()).deleteValue(name)
}
