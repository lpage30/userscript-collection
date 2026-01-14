import { getGeoIndexedDB } from './geo_indexed_db'
import { Country } from './countrystatecitytypes'
import { normalizeName } from '../common/functions'

export async function getCountry(countryName: string): Promise<Country | undefined> {
    const key = `Country.${normalizeName(countryName).trim().toLowerCase()}`
    const result = await (await getGeoIndexedDB('Country')).getValue(key)

    return result ? JSON.parse(result) as Country : undefined
}

export async function setCountry(countryName: string, country: string): Promise<void> {
    const key = `Country.${normalizeName(countryName).trim().toLowerCase()}`
    await (await getGeoIndexedDB('Country')).setValue(key, country)
}
