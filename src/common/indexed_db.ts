// @grant    GM_info
import { openDB, deleteDB, IDBPDatabase } from 'idb'
import { toDurationString, ONE_MONTH } from './datetime'

export interface IndexedDB {
    dbname: string
    storeName: string
    createTime: number
    maxDBAgeMs: number
    dbAgeMs: number
    getValue: (name: string, defaultValue?: any) => Promise<any>
    getAll: () => Promise<any[]>
    setValue: (name: string, value: any) => Promise<void>
    deleteValue: (name: string) => Promise<void>
}

class IndexedDBClass implements IndexedDB {
    private db: Promise<IDBPDatabase<unknown>>
    private dbMetadata: {
        name: string,
        storeName: string,
        createTime: number,
        maxDBAgeMs: number
    }

    constructor(
        db: Promise<IDBPDatabase<unknown>>,
        name: string,
        storeName: string,
        createTime: number,
        maxDBAgeMs: number
    ) {
        this.db = db
        this.dbMetadata = {
            name,
            storeName,
            createTime,
            maxDBAgeMs,
        }
    }
    get dbname() {
        return this.dbMetadata.name
    }
    get storeName() {
        return this.dbMetadata.storeName
    }
    get createTime() {
        return this.dbMetadata.createTime
    }
    get maxDBAgeMs() {
        return this.dbMetadata.maxDBAgeMs
    }
    get dbAgeMs() {
        return Date.now() - this.dbMetadata.createTime
    }
    async getValue(name: string, defaultValue?: any): Promise<any> {
        try {
            const result = await (await this.db).get(this.dbMetadata.storeName, name)
            return result ? result : defaultValue
        } catch (e) {
            console.error(`${this.toString()}.getValue(${name}) Failed.`, e)
            throw e
        }
    }
    async getAll(): Promise<any[]> {
        try {
            const result = await (await this.db).getAll(this.dbMetadata.storeName)
            return result
        } catch (e) {
            console.error(`${this.toString()}.getAll() Failed.`, e)
            throw e
        }

    }
    async setValue(name: string, value: any): Promise<void> {
        try {
            await (await this.db).put(this.dbMetadata.storeName, value, name)
        } catch (e) {
            console.error(`${this.toString()}.setValue(${name}) Failed.`, e)
            throw e
        }
    }
    async deleteValue(name: string): Promise<void> {
        try {
            await (await this.db).delete(this.dbMetadata.storeName, name)
        } catch (e) {
            console.error(`${this.toString()}.deleteValue(${name}) Failed.`, e)
            throw e
        }

    }
    toString(): string {
        return `IndexedDB[${this.dbMetadata.name}-${this.dbMetadata.storeName}(${toDurationString(this.dbAgeMs)})]`
    }
}

export async function openIndexedDB(dbName: string, storeName: string, maxDBAgeMs: number): Promise<IndexedDB> {
    const db = openDB(dbName, 1, {
        upgrade(db) {
            db.createObjectStore(storeName)
        }
    })
    const now = Date.now()
    let createdTime = await (await db).get(storeName, 'DatabaseCreatedTime')

    if (createdTime && maxDBAgeMs < (now - createdTime)) {
        console.log(`Recreating ${dbName}. Age: ${toDurationString(now - createdTime)}`)
        await deleteDB(dbName)
        return openIndexedDB(dbName, storeName, maxDBAgeMs)
    }
    if ([null, undefined].includes(createdTime)) {
        createdTime = now
        await (await db).put(storeName, createdTime, 'DatabaseCreatedTime')
    }
    return new IndexedDBClass(db, dbName, storeName, createdTime, maxDBAgeMs)
}

export async function openGMScriptIndexedDB(storeName: string): Promise<IndexedDB> {
    return openIndexedDB(GM_info.script.name, storeName, 6 * ONE_MONTH)
}
