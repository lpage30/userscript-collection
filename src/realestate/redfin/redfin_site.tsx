// @grant       GM_xmlhttpRequest
// @connect     cdn-redfin.com
// @connect     maps.co
import {
    PropertyInfo,
    MaxPropertyInfoImageWidth
} from '../propertyinfotypes'
import {
    toCreateButtonFunction,
} from '../propertyinfotype_functions'
import { CountryAddress, GeodataSourceType } from '../../geocoding/datatypes'
import { parseFullAddress, FullAddress, joinFullAddress } from '../../geocoding/geocoding_api/address_parser'
import { RealEstateSite, PropertyPageType, ScrapedProperties } from '../realestatesitetypes'
import { parseNumber } from '../../common/functions'
import { toDurationString } from '../../common/datetime'

import { toPictureSerialized, toScaledPictureSerialized, toScaledImgSerialized, deserializeImg, toSerializedElement, deserializeElement } from '../serialize_deserialize_functions'
import { awaitQuerySelection, awaitQueryAll, awaitPageLoadByMutation } from '../../common/await_functions'

const source = 'Redfin.com'
const oceanGeodataSource: GeodataSourceType = 'tl_2025_us_coastline'
const currencySymbol = '$'
const countryAddress: CountryAddress = {
    name: 'United States',
    codes: ['USA', 'US']
}
interface ScriptAmenityFeature {
    '@type': string
    'name': string
    'value': boolean

}
interface ScriptImageData {
    '@type': string
    'url': string
    'width': number
    'height': number
}
interface ScriptAddress {
    '@type': string
    'addressCountry': string
    'addressLocality': string
    'addressRegion': string
    'postalCode': string
    'streetAddress': string
}
interface ScriptFloorSize {
    '@type': string
    'unitCode': string
    'value'?: number
}
interface ScriptGeo {
    '@type': string
    'latitude': number
    'longitude': number
}
interface ScriptData {
    '@context'?: string
    '@type': string | string[]
    'datePosted'?: string
    'description'?: string
    'image'?: ScriptImageData | ScriptImageData[]
    'lastReviewed'?: string
    'mainEntity'?: ScriptData
    'offers'?: any
    'potentialAction'?: any
    'accommodationCategory'?: string
    'address'?: ScriptAddress,
    'numberOfBathroomsTotal'?: number
    'numberOfBedrooms'?: number
    'yearBuilt'?: number
    'amenityFeature'?: ScriptAmenityFeature
    'floorSize'?: ScriptFloorSize,
    'geo'?: ScriptGeo,
    'name': string
    'numberOfRooms'?: number
    'url'?: string
    'hasMap'?: string
}
interface LayoutMenuButtons {
    Grid?: HTMLElement
    Map?: HTMLElement
    Split?: HTMLElement
    Table?: HTMLElement
}

function scrapeScriptData(scriptData: ScriptData, element?: HTMLElement): Partial<PropertyInfo> {
    const result: Partial<PropertyInfo> = scriptData.mainEntity
        ? scrapeScriptData(scriptData.mainEntity, element)
        : { source, oceanGeodataSource, currencySymbol }
    const elementTextLines = element ? element.innerText.split('\n').map(t => t.trim()) : []
    if (scriptData.mainEntity === undefined) {
        result.isLand = (scriptData.floorSize ?? {}).value === undefined
        result.Type = result.isLand ? 'land' : scriptData['@type'] as string
        if (scriptData.address) {
            let fullAddress: FullAddress = {
                street: [undefined, null, ''].includes(scriptData.address.streetAddress) ? undefined : scriptData.address.streetAddress,
                city: [undefined, null, ''].includes(scriptData.address.addressLocality) ? undefined : scriptData.address.addressLocality,
                postalcode: [undefined, null, ''].includes(scriptData.address.postalCode) ? undefined : scriptData.address.postalCode,
                state: [undefined, null, ''].includes(scriptData.address.addressRegion) ? undefined : scriptData.address.addressRegion,
                country: [undefined, null, ''].includes(scriptData.address.addressCountry) ? undefined : scriptData.address.addressCountry
            }
            if (Object.values(fullAddress).some(v => v === undefined) && 0 < elementTextLines.length) {
                const nonEmptyParts = Object.values(fullAddress).filter(v => v !== undefined)
                if (0 < nonEmptyParts.length) {
                    const foundLine = elementTextLines.find(line => nonEmptyParts.every(part => line.includes(part)))
                    if (foundLine) {
                        fullAddress = parseFullAddress(foundLine, countryAddress)
                    }
                }
            }
            fullAddress.country = fullAddress.country ?? countryAddress.name

            result.city = fullAddress.city
            result.state = fullAddress.state
            result.country = fullAddress.country

            result.address = joinFullAddress(fullAddress)
        }
        result.Sqft = (scriptData.floorSize ?? {}).value
        if (scriptData.geo) {
            result.coordinate = {
                lat: scriptData.geo.latitude,
                lon: scriptData.geo.longitude
            }
        }
        if (scriptData.numberOfBathroomsTotal) result.Bathrooms = scriptData.numberOfBathroomsTotal
        if (scriptData.numberOfBedrooms) result.Bedrooms = scriptData.numberOfBedrooms
        if (scriptData.yearBuilt) result.Year = scriptData.yearBuilt
    }

    const href = scriptData.url
    result.href = () => href
    let imgs: ScriptImageData[] = Array.isArray(scriptData.image) ? scriptData.image : scriptData.image ? [scriptData.image] : undefined
    if (undefined === imgs && element) {
        imgs = Array.from(element.querySelectorAll('img')).map(img => ({
            '@type': 'queried image',
            url: img.src,
            width: img.width,
            height: img.height
        }))
    }
    const img = (imgs ?? [])[0]

    result.serializedPicture = toScaledImgSerialized(img ? { src: img.url, width: img.width, height: img.height } : undefined, MaxPropertyInfoImageWidth)
    result.Picture = deserializeImg(result.serializedPicture, result)
    return result
}

function scrapeListing(reportProgress: (progress: string) => void, containsOlderResults: boolean, includeOlderResults?: boolean): Partial<PropertyInfo>[] {
    let tBegin = Date.now()
    const properties: Partial<PropertyInfo>[] = []
    let parentElement: ParentNode = document
    if (containsOlderResults && [undefined, null, false].includes(includeOlderResults)) {
        parentElement = Array.from(document.querySelectorAll('div[class*="homecard-carousel"]')).slice(-1)[0]
    }
    const elements: HTMLElement[] = Array.from(parentElement.querySelectorAll('div[class*="bp-Homecard "]')).filter((e: HTMLElement): e is HTMLElement => 0 < e.innerText.trim().length)
    const scriptData = Array.from(parentElement.querySelectorAll('script'))
        .map(s => s.innerText)
        .filter(t => 0 < t.length && ['{\"@context\"', '[{\"@context\"'].some(prefix => t.startsWith(prefix)))
        .map(t => JSON.parse(t))
        .flat()
        .filter(data => !['BreadcrumbList', 'Product', 'Organization', 'Event'].includes(data['@type']))

    tBegin = Date.now()
    for (let i = 0; i < Math.min(elements.length, scriptData.length); i = i + 1) {
        const elementLines = elements[i].innerText.split('\n').map(t => t.trim())
        const property: Partial<PropertyInfo> = scrapeScriptData(scriptData[i], elements[i])
        property.Price = property.Price ?? parseNumber(elementLines.find(p => p.startsWith('$')))
        property.Bathrooms = property.Bathrooms ?? parseNumber(elementLines.find(p => (/^[\d\.]+\s*bath?/ig).test(p)))
        property.Bedrooms = property.Bedrooms ?? parseNumber(elementLines.find(p => (/^[\d\.]+\s*bed?/ig).test(p)))
        property.serializedElement = toSerializedElement({ queryAllPickItemChild: { queryAllString: 'div[class*="bp-Homecard "]', itemChildGrandchildIndexes: [i] } })
        property.element = deserializeElement(property.serializedElement)
        property.serializedPicture = toPictureSerialized(elements[i].querySelector('img'))
        property.Picture = deserializeImg(property.serializedPicture, property)

        properties.push(property)
    }
    if (reportProgress) reportProgress(`Scraped ${properties.length} properties ${toDurationString(Date.now() - tBegin)} `)
    return properties
}

export const RedfinSite: RealEstateSite = {
    name: 'Redfin',
    containerId: 'redfin-realestate-id',
    isSupported: (href: string): boolean => Object.values(RedfinSite.pages).some(page => page.isPage(href)),
    pages: {

        [PropertyPageType.Feed]: {
            pageType: PropertyPageType.Feed,
            containsOlderResults: false,
            isPage: (href: string): boolean => ('https://www.redfin.com/#userFeed' === href || 'https://www.redfin.com/' === href),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                let result: HTMLElement[] = []
                const toggleButtonSelector = 'button[aria-label*="Toggle to "]'
                result = Array.from(parentElement
                    ? parentElement.querySelectorAll(toggleButtonSelector)
                    : await awaitQueryAll(toggleButtonSelector)
                )
                return result

            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return element.ariaLabel.startsWith('Toggle to')
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: (reportProgress: (progress: string) => void, includeOlderResults?: boolean): ScrapedProperties => {
                const href = window.location.href
                return {
                    properties: scrapeListing(reportProgress, RedfinSite.pages[PropertyPageType.Feed].containsOlderResults),
                    containsOlderResults: includeOlderResults === true
                }
            }
        },

        [PropertyPageType.Listing]: {
            pageType: PropertyPageType.Listing,
            containsOlderResults: window.location.href.includes('/chat'),
            isPage: (href: string): boolean => (
                null !== href.match(/^https:\/\/www.redfin.com\/(city|zipcode|neighborhood|chat|myredfin\/favorites).*/)
            ),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                if (window.location.href.includes('/chat')) {
                    return RedfinSite.pages[PropertyPageType.Feed].getMapToggleElements(parentElement)
                }
                if (window.location.href.includes('/myredfin/favorites')) {
                    return Array.from(await awaitQueryAll('div[class*="SegmentedControl__option "]', { parentElement })).filter(div => div.ariaChecked === 'false')
                }
                (await awaitQuerySelection('div[class="ExposedLayoutButtonContainer"]', { parentElement })).querySelector('button').click()
                const buttons = Array.from((await awaitQuerySelection('div[class*="ExposedLayoutMenu"]', { parentElement })).querySelectorAll('li[class="MenuItem"]'))
                    .reduce((obj, li) => ({ ...obj, [(li as HTMLElement).innerText]: li.querySelector('button') }), {} as LayoutMenuButtons)
                return [buttons.Map ?? buttons.Grid]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                if (window.location.href.includes('/chat')) {
                    return RedfinSite.pages[PropertyPageType.Feed].isMapToggleElement(element)
                }
                if (window.location.href.includes('/myredfin/favorites')) {
                    return element.tagName === 'DIV' && element.className.includes('SegmentedControl__option')
                }
                return element.tagName === 'BUTTON'
            },

            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: (reportProgress: (progress: string) => void, includeOlderResults?: boolean): ScrapedProperties => {
                return {
                    properties: scrapeListing(reportProgress, RedfinSite.pages[PropertyPageType.Listing].containsOlderResults),
                    containsOlderResults: includeOlderResults === true
                }
            }
        },

        [PropertyPageType.Single]: {
            pageType: PropertyPageType.Single,
            containsOlderResults: false,
            isPage: (href: string): boolean => (null !== href.match(/^https:\/\/www.redfin.com\/.*\/home\/\d+$/)),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => [await awaitQuerySelection('div[class*="static-map"]')],
            isMapToggleElement: (element: HTMLElement): boolean => {
                return Array.from(element.classList).some(name => name === 'static-map')
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: (reportProgress: (progress: string) => void, includeOlderResults?: boolean): ScrapedProperties => {
                const href = window.location.href
                const tBegin = Date.now()
                const element: HTMLElement = document.querySelector('div[class="detailsContent"]')
                const result: Partial<PropertyInfo> = scrapeScriptData(JSON.parse(
                    Array.from(element.querySelectorAll('script'))
                        .filter(s => s.innerText.startsWith('{\"@context\"'))[0].innerText
                ))
                result.serializedElement = toSerializedElement({ queryString: 'div[class="detailsContent"]' })
                result.element = deserializeElement(result.serializedElement)
                result.serializedPicture = toScaledPictureSerialized(
                    document.getElementById('MBImage').querySelector('img'),
                    MaxPropertyInfoImageWidth
                ) ?? result.serializedPicture
                result.Picture = deserializeImg(result.serializedPicture, result)

                const imgBtn = document.querySelector('div[class*="static-map"]').querySelector('img')
                if (imgBtn) {
                    result.createMapButton = toCreateButtonFunction()
                }
                if (reportProgress) reportProgress(`Scraped 1 property ${toDurationString(Date.now() - tBegin)} `)

                return {
                    properties: [result],
                    containsOlderResults: includeOlderResults === true
                }
            }
        }
    }
}
