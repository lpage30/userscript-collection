import {
    PropertyInfo,
    MaxPropertyInfoImageWidth
} from '../propertyinfotypes'
import {
    toPropertyInfoCard,
    geocodePropertyInfoCard,
    toCreateButtonFunction,
} from '../propertyinfotype_functions'
import { PropertyPageType, RealEstateSite } from '../realestatesitetypes'
import { parseNumber } from '../../common/functions'
import { toDurationString } from '../../common/datetime'
import {
    toPictureSerialized,
    toScaledPictureSerialized,
    deserializeImg,
    toSerializedElement,
    deserializeElement
} from '../serialize_deserialize_functions'
import { GeoCoordinate, GeodataSourceType, CountryAddress } from '../../geocoding/datatypes'
import { parseAddress, FullAddress, joinFullAddress } from '../../geocoding/geocoding_api/address_parser'

import { awaitQuerySelection, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'
import { cacheWrapper } from '../propertyinfocache'

const countryAddress: CountryAddress = {
    name: 'United States',
    codes: ['USA', 'US']
}

interface ScriptDescription {
    'baths_consolidated': string | null
    'baths_max': any
    'baths_min': any
    'beds': number | null
    'beds_max': any
    'beds_min': any
    'garage': number | null
    'lot_sqft': number | null
    'name': any
    'sold_date': any
    'sold_price': any
    'sqft': number | null
    'sqft_max': any
    'sqft_min': any
    'sub_type': any
    'type': string | null
    'year_built': number | null

}
interface ScriptLocation {
    'address': {
        'line': string
        'city': string
        'state': string
        'state_code': string
        'postal_code': string
        'coordinate': {
            'lat': number
            'lon': number
        }
    }
    'county': any
    'street_view_url': any
}
interface ScriptNextData {
    'property_id': string
    'description': ScriptDescription
    'location': ScriptLocation
    'primary_photo': { href: string }
    'list_price': number
    'permalink': string

    'advertisers'?: any
    'branding': any
    'community': any
    'flags': any
    'lead_attributes': any
    'list_date': any
    'listing_id': any
    'mattersport': any
    'open_houses': any
    'photos': any
    'price_reduced_amount': any
    'products': any
    'rmn_listing_attribution': any
    'search_promotions': any
    'source': any
    'status': any
    'virtual_tours': any
}
function scrapeScriptData(scriptData: ScriptNextData): Partial<PropertyInfo> {
    const serializedElement = toSerializedElement({ elementId: `placeholder_property_${scriptData.property_id}` })
    const element = deserializeElement(serializedElement)
    const address: FullAddress = {
        street: scriptData.location.address.line,
        city: scriptData.location.address.city,
        state: scriptData.location.address.state_code,
        postalcode: scriptData.location.address.postal_code,
        country: countryAddress.name
    }
    const result = {
        source: 'Realtor.com',
        oceanGeodataSource: 'tl_2025_us_coastline' as GeodataSourceType,
        currencySymbol: '$',
        isLand: scriptData.description.type === 'land',
        Type: scriptData.description.type,
        Year: scriptData.description.year_built,
        Garage: scriptData.description.garage,
        Price: scriptData.list_price,
        Bedrooms: scriptData.description.beds,
        Bathrooms: parseFloat(scriptData.description.baths_consolidated),
        Sqft: scriptData.description.sqft,
        lotSize: scriptData.description.lot_sqft,
        address: joinFullAddress(address),
        city: address.city,
        state: address.state,
        country: address.country,
        coordinate: scriptData.location.address.coordinate ? { ...scriptData.location.address.coordinate } : undefined,
        href: () => `https://www.realtor.com/realestateandhomes-detail/${scriptData.permalink}`,
        serializedElement,
        element,
    }
    const serializedPicture = toPictureSerialized(result.element.querySelector('img[data-testid="picture-img"]'))
    const Picture = deserializeImg(serializedPicture, result)
    return {
        ...result,
        serializedPicture,
        Picture,
    }
}
export const RealtorSite: RealEstateSite = {
    name: 'Realtor',
    containerId: 'realtor-realestate-id',
    isSupported: (href: string): boolean => Object.values(RealtorSite.pages).some(page => page.isPage(href)),
    pages: {
        [PropertyPageType.Listing]: {
            pageType: PropertyPageType.Listing,
            isPage: (href: string): boolean => href.startsWith('https://www.realtor.com/realestateandhomes-search') || href.startsWith('https://www.realtor.com/recommended'),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitQuerySelection('div[class*="ListView_lazyWrapperPlaceholder__bcuKe"]')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const List = document.querySelector('button[data-testid="map-to-list-view-toggle"]') as HTMLElement
                const Map = document.querySelector('button[data-testid="list-to-map-view-toggle"]') as HTMLElement
                return [List.ariaPressed === 'false' ? List : Map]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return element.dataset.testid.endsWith('-view-toggle')
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (reportProgress: (progress: string) => void, force?: boolean): Promise<PropertyInfo[]> => {
                const href = window.location.href
                const collectData = async (): Promise<PropertyInfo[]> => {
                    let tBegin = Date.now()
                    const result: PropertyInfo[] = []
                    const scrapedProperties = JSON.parse(document.getElementById('__NEXT_DATA__').innerText).props.pageProps.properties.map(scrapeScriptData)
                    if (reportProgress) reportProgress(`Scraped ${scrapedProperties.length} properties ${toDurationString(Date.now() - tBegin)}`)
                    tBegin = Date.now()
                    for (const scrapedProperty of scrapedProperties) {
                        result.push(await geocodePropertyInfoCard(toPropertyInfoCard(scrapedProperty), reportProgress))
                    }
                    if (reportProgress) reportProgress(`Geocoded ${result.length} properties ${toDurationString(Date.now() - tBegin)}`)
                    return result
                }
                return cacheWrapper(RealtorSite.name, href, collectData, force)
            },

        },
        [PropertyPageType.Single]: {
            pageType: PropertyPageType.Single,
            isPage: (href: string): boolean => href.startsWith('https://www.realtor.com/realestateandhomes-detail'),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitElementById('Property details')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const List = document.querySelector('button[aria-label="close"]') as HTMLElement
                const MapSvg = document.querySelector('svg[data-testid="listing-summary-map__container"]') as HTMLElement
                const Map = document.querySelector('button[data-testid="map-snapshot-map-btn"]') as HTMLElement
                return [List ?? Map ?? MapSvg]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return ['__map__container', '-map-btn'].some(idSuffix => element.dataset.testid.endsWith(idSuffix)) || element.ariaLabel == 'close'
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (reportProgress: (progress: string) => void, force?: boolean): Promise<PropertyInfo[]> => {
                const href = window.location.href
                const collectData = async (): Promise<PropertyInfo[]> => {
                    let result: Partial<PropertyInfo> = {
                        source: 'Realtor.com',
                        oceanGeodataSource: 'tl_2025_us_coastline' as GeodataSourceType,
                        currencySymbol: '$',
                        href: () => href,
                    }
                    result.serializedElement = toSerializedElement({ queryString: 'div[data-testid="ldp-main-container"]' })
                    result.element = deserializeElement(result.serializedElement)
                    result.Price = parseNumber((await awaitQuerySelection('div[data-testid="ldp-list-price"]')).innerText)
                    result = {
                        ...result, ...Array.from((await awaitQuerySelection('div[data-testid="ldp-home-facts"]')).querySelectorAll('li'))
                            .map((e): Partial<PropertyInfo> => {
                                const value = e.innerText.split('\n')[0]
                                switch (e.dataset.testid) {
                                    case 'property-meta-beds':
                                        return { Bedrooms: parseNumber(value) }
                                    case 'property-meta-baths':
                                        return { Bathrooms: parseNumber(value) }
                                    case 'property-meta-sqft':
                                        return { Sqft: parseNumber(value) }
                                    case 'property-meta-lot-size':
                                        return { lotSize: parseNumber(value) }
                                    default:
                                        return {}
                                }
                            }).reduce((propinfo, obj) => ({
                                ...propinfo,
                                ...obj,
                            }), {} as Partial<PropertyInfo>)
                    }
                    const addrText = (document.querySelector('div[data-testid="address-line-ldp"]') as HTMLElement).innerText
                    result = {
                        ...result,
                        isLand: [null, undefined].includes(result.Bathrooms),
                        ...parseAddress(addrText, countryAddress),
                    }
                    const coordinate = Array.from(document.querySelectorAll('meta[property*="place:location"]'))
                        .reduce((coordinate, e) => ({
                            ...coordinate,
                            [e.attributes.getNamedItem('property').value.split(':').slice(-1)[0].slice(0, 3)]: parseNumber(e.attributes.getNamedItem('content').value)
                        }), {} as Partial<GeoCoordinate>)

                    result.coordinate = Object.keys(coordinate).length === 2 ? coordinate as GeoCoordinate : undefined

                    result = {
                        ...result, ...Array.from(document.querySelector('div[data-testid="ldp-highlighted-facts"]').querySelectorAll('li'))
                            .map(e => e.innerText.split('\n').filter(t => 0 < t.length))
                            .map(([name, value]): Partial<PropertyInfo> => {
                                if (name.includes('Property type')) return { Type: value }
                                if (name.includes('Year built')) return { Year: parseNumber(value) }
                                if (name.includes('HOA fees')) return { HOA: parseNumber(value) }
                                if (name.includes('Garage')) return { Garage: parseNumber(value) }
                                return {}
                            }).reduce((propinfo, obj) => ({
                                ...propinfo,
                                ...obj,
                            }), {} as Partial<PropertyInfo>)
                    }
                    result.serializedPicture = toScaledPictureSerialized(document.querySelector('ul[data-testid="carousel-track"]').querySelector('li').querySelector('img'), MaxPropertyInfoImageWidth)
                    result.Picture = deserializeImg(result.serializedPicture, result)

                    const mapBtn = await awaitQuerySelection('button[data-testid="map-snapshot-map-btn"]')
                    if (mapBtn) {
                        result.createMapButton = toCreateButtonFunction()
                    }
                    return [await geocodePropertyInfoCard(toPropertyInfoCard(result), reportProgress)]
                }
                return cacheWrapper(RealtorSite.name, href, collectData, force)
            }
        },
    }
}