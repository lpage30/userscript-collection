import { getGeoIndexedDB } from './geo_indexed_db'
import { GeneratedGeocodedCountry } from './geocodedcountrystatecitytypes'
import { normalizeName } from '../common/functions'

export async function getGeocodedCountryExtension(countryName: string): Promise<GeneratedGeocodedCountry | undefined> {
    const key = `GeocodedCountryExtension.${normalizeName(countryName).trim().toLowerCase()}`
    const result = await (await getGeoIndexedDB('GeocodedCountryExtension')).getValue(key)

    return result ? JSON.parse(result) as GeneratedGeocodedCountry : undefined
}

export async function setGeocodedCountryExtension(countryName: string, countryExtension: string): Promise<void> {
    const key = `GeocodedCountryExtension.${normalizeName(countryName).trim().toLowerCase()}`
    await (await getGeoIndexedDB('GeocodedCountryExtension')).setValue(key, countryExtension)
}
