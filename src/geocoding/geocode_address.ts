// @grant       GM_xmlhttpRequest
// @connect     cdn-redfin.com
// @connect     maps.co
import { GeoAddress, parseFullAddress, joinFullAddress, fullAddressToGeoAddress } from "./datatypes"
import { fetchImgMetadata } from "../common/image_metadata_extractor"
import { getGeocodeServiceInstance } from "./geocoding_api/geocodeMapsCoAPI"
import { classifyGeoCountryStateCity, countryStateCityAddressToGeoAddress } from "./countryStateCityGeoAddressClassifiers"
export interface GeocodeAddressResult extends GeoAddress {
    origin: 'Image' | 'GeocodeService' | 'CityStateCountry'
}
export async function geocodeAddress(
    address: string,
    imgSrcs?: string[]
): Promise<GeocodeAddressResult | undefined> {
    const fullAddress = parseFullAddress(address)
    for (const imgSrc of (imgSrcs ?? [])) {
        const metadata = await fetchImgMetadata(imgSrc, false)
        if (metadata.exif && metadata.exif.gps) {
            console.log(`Coordinate Found in Img ${imgSrc}. EXIF result: ${JSON.stringify(metadata.exif, null, 2)}`)
            return {
                origin: 'Image',
                address: joinFullAddress(fullAddress),
                city: fullAddress.city,
                state: fullAddress.state,
                country: fullAddress.country,
                coordinate: metadata.exif.gps
            }
        }
    }
    const geoAddress = await getGeocodeServiceInstance().geocodeAddress(fullAddress)
    if (geoAddress) {
        console.log(`Coordinate Found via GeocodeService (${getGeocodeServiceInstance().name}).`)
        return {
            origin: 'GeocodeService',
            ...geoAddress
        }
    }
    const countryStateCityAddress = await classifyGeoCountryStateCity(fullAddressToGeoAddress(fullAddress))
    console.log(`Coordinate Found via classifyGeoCountryStateCity's city|state|country coordinate.`)
    return {
        origin: 'CityStateCountry',
        ...countryStateCityAddressToGeoAddress(countryStateCityAddress)
    }
}