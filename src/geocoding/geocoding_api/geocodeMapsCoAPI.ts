// @grant       GM_xmlhttpRequest
// @connect     maps.co
import APIConfig from '../data_files/geocode_maps_co_api.config.json'
import { GeoCoordinate, GeoAddress } from '../datatypes'
import { awaitDelay } from '../../common/await_functions'

export interface GeocodeServiceAPI {
    name: string
    geocodeAddress(address: Omit<GeoAddress, 'coordinate'>): Promise<GeoCoordinate | undefined>
    resolveToAddress(coordinate: GeoCoordinate): Promise<GeoAddress | undefined>
    searchPlace(placeName: string): Promise<GeoAddress | undefined>
}
interface GeocodeMapsCoAPIConfig {
    geocodeMapsCoAPIKey: string
    requestPerSecond: number
    maxAttempts: number
}
interface GeocodeMapsCoPlaceRecord {
    place_id: number
    osm_type: string,
    osm_id: string,
    lat: string,
    lon: string,
    display_name: string,
    type: string,
    importance: number,
    address: {
        city: string,
        state: string,
        country: string,
        country_code: string
    }
}
interface GeocodeMapsCoReverseRequest {
    command: 'reverse'
    params: { lat: string, lon: string }
}
interface GeocodeMapsCoSearchRequest {
    command: 'search'
    params: string | Partial<{
        street: string,
        city: string,
        state: string,
        country: string,
        postalcode: string
    }>
}

class GeocodeMapsCoAPI implements GeocodeServiceAPI {
    private config: GeocodeMapsCoAPIConfig
    private lastCallTimestamp: number
    private throttlems: number
    constructor(config: GeocodeMapsCoAPIConfig) {
        this.config = { ...config }
        this.lastCallTimestamp = 0
        this.throttlems = 1000 / this.config.requestPerSecond
    }
    get name() {
        return 'geocode.maps.co'
    }
    private async executeCall(
        request: GeocodeMapsCoReverseRequest | GeocodeMapsCoSearchRequest
    ): Promise<GeocodeMapsCoPlaceRecord | GeocodeMapsCoPlaceRecord[]> {
        const requestUrl = new URL(`https://geocode.maps.co/${request.command}`)
        requestUrl.search = new URLSearchParams({
            ...(typeof request.params === 'string'
                ? { q: request.params }
                : request.params
            ),
            api_key: this.config.geocodeMapsCoAPIKey

        }).toString()

        const requestUrlString = requestUrl.toString()
        let attempts = 0
        let delayms = 0
        if ((Date.now() - this.lastCallTimestamp) < this.throttlems) {
            delayms = this.throttlems
        }
        do {
            attempts = attempts + 1
            if (0 < delayms) {
                console.log(`GeocodeMapsCoAPI: Attempt ${attempts}/${this.config.maxAttempts} throttling for ${delayms}`)
                await awaitDelay(delayms)
            }
            try {
                const result = await new Promise<GeocodeMapsCoPlaceRecord | GeocodeMapsCoPlaceRecord[]>(
                    (resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: requestUrlString,
                            headers: {
                                Accept: "application/json",
                            },
                            onload: (response: GM_xmlhttpRequestResponse) => {
                                if (response.status < 200 || 300 <= response.status) {
                                    reject({ statusCode: response.status, statusText: response.statusText })
                                    return
                                }
                                const content = JSON.parse(response.responseText);
                                if (Array.isArray(content)) {
                                    resolve(content.map(c => c as GeocodeMapsCoPlaceRecord))
                                } else {
                                    resolve(content as GeocodeMapsCoPlaceRecord)
                                }
                            },
                            onerror: (response) => {
                                reject({
                                    statusCode: response.status,
                                    statusText: response.statusText,
                                    error: new Error(`${requestUrl} - ${response['error'] ?? response.statusText}`)
                                })
                            }
                        })
                    }
                )
                return result
            } catch (e) {
                if (![null, undefined].includes(e.statusCode)) {
                    if (this.config.maxAttempts <= attempts) {
                        throw new Error(`GeocodeMapsCoAPI: Still failing after ${attempts} attempts. ${e.statusCode} ${e.statusText}`)
                    }
                    switch (e.statusCode) {
                        case 429:
                            console.log(`GeocodeMapsCoAPI: Rate limiting (429) ${e.statusText}`)
                            // delay the full window on next attempt
                            delayms = this.throttlems * this.config.requestPerSecond
                            break
                        case 503:
                            console.log(`GeocodeMapsCoAPI(${requestUrlString}): Service Unavailable (503) ${e.statusText}`)
                            // delay longer and longer
                            delayms = attempts * this.throttlems
                            break
                        case 403:
                            console.error(`GeocodeMapsCoAPI(${requestUrlString}): Not Authorized (401). ${JSON.stringify(this.config)}`, e)
                            throw new Error('GeocodeMapsCoAPI: Not Authorized (401) ${e.statusText}')
                        case 403:
                            console.error(`GeocodeMapsCoAPI(${requestUrlString}): Blocked (403)`, e)
                            throw new Error('GeocodeMapsCoAPI: Blocked (403) ${e.statusText}')
                        default:
                            console.error(`GeocodeMapsCoAPI(${requestUrlString}): ${e.statusCode} ${e.statusText}`, e)
                            throw new Error(`GeocodeMapsCoAPI: ${e.statusCode} ${e.statusText}`)
                    }
                } else {
                    console.error(`GeocodeMapsCoAPI(${requestUrlString}): Failed. ${JSON.stringify(this.config)}`, e)
                    throw e
                }
            } finally {
                this.lastCallTimestamp = Date.now()
            }
        } while (attempts < this.config.maxAttempts)
    }

    async geocodeAddress(address: Omit<GeoAddress, 'coordinate'>): Promise<GeoCoordinate | undefined> {
        const request: GeocodeMapsCoSearchRequest = {
            command: 'search',
            params: {
                street: address.address,
                city: address.city,
                state: address.state,
                country: address.country
            }
        }
        const response = await this.executeCall(request)
        const result: GeocodeMapsCoPlaceRecord | undefined = Array.isArray(response) ? response[0] : response
        return result
            ? {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon)
            }
            : undefined
    }

    async resolveToAddress(coordinate: GeoCoordinate): Promise<GeoAddress | undefined> {
        const request: GeocodeMapsCoReverseRequest = {
            command: 'reverse',
            params: {
                lat: `${coordinate.lat}`,
                lon: `${coordinate.lon}`,
            }
        }
        const response = await this.executeCall(request)
        const result: GeocodeMapsCoPlaceRecord | undefined = Array.isArray(response) ? response[0] : response
        return result
            ? {
                city: result.address.city,
                state: result.address.state,
                country: result.address.country,
                coordinate: {
                    lat: parseFloat(result.lat),
                    lon: parseFloat(result.lon),
                }
            }
            : undefined
    }

    async searchPlace(placeName: string): Promise<GeoAddress | undefined> {
        const request: GeocodeMapsCoSearchRequest = {
            command: 'search',
            params: placeName
        }
        const response = await this.executeCall(request)
        const result: GeocodeMapsCoPlaceRecord | undefined = Array.isArray(response) ? response[0] : response
        return result
            ? {
                city: result.address.city,
                state: result.address.state,
                country: result.address.country,
                coordinate: {
                    lat: parseFloat(result.lat),
                    lon: parseFloat(result.lon),
                }
            }
            : undefined
    }

}

let gGocodeService: GeocodeServiceAPI | undefined = undefined

export const getGeocodeServiceInstance = (): GeocodeServiceAPI => {
    if (undefined === gGocodeService) {
        gGocodeService = new GeocodeMapsCoAPI(APIConfig)
    }
    return gGocodeService
}
