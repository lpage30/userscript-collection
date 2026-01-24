import {
    PropertyInfo,
    MaxPropertyInfoImageWidth
} from '../propertyinfotypes'
import {
    toCreateButtonFunction,
    toPropertyInfoCard,
    geocodePropertyInfoCard,
} from '../propertyinfotype_functions'

import { RealEstateSite, PropertyPageType } from '../realestatesitetypes'
import { parseNumber } from '../../common/functions'
import { toDurationString } from '../../common/datetime'

import { toPictureSerialized, toScaledPictureSerialized, toScaledImgSerialized, deserializeImg, toSerializedElement, deserializeElement } from '../serialize_deserialize_functions'
import { awaitQuerySelection, awaitQueryAll, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'
import { cacheWrapper } from '../propertyinfocache'

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

function scrapeScriptData(scriptData: ScriptData, elementTextLines?: string[]): Partial<PropertyInfo> {
    const result: Partial<PropertyInfo> = scriptData.mainEntity
        ? scrapeScriptData(scriptData.mainEntity, elementTextLines)
        : { source: 'redfin.com', }
    if (scriptData.mainEntity === undefined) {
        result.isLand = (scriptData.floorSize ?? {}).value === undefined
        result.Type = result.isLand ? 'land' : scriptData['@type'] as string
        if (scriptData.address) {
            let addressParts = [
                [undefined, null, ''].includes(scriptData.address.streetAddress) ? undefined : scriptData.address.streetAddress,
                [undefined, null, ''].includes(scriptData.address.addressLocality) ? undefined : scriptData.address.addressLocality,
                [undefined, null, ''].includes(scriptData.address.addressRegion) ? undefined : scriptData.address.addressRegion,
                [undefined, null, ''].includes(scriptData.address.addressCountry) ? undefined : scriptData.address.addressCountry
            ]
            if (addressParts.some(part => part === undefined) && 0 < (elementTextLines ?? []).length) {
                const nonEmptyParts = addressParts.filter(part => part !== undefined)
                if (0 < nonEmptyParts.length) {
                    const foundLine = elementTextLines.find(line => nonEmptyParts.every(part => line.includes(part)))
                    if (foundLine) {
                        const parsedParts = foundLine.split(',').map(t => t.trim())
                        addressParts = [
                            addressParts[0] ?? (3 <= parsedParts.length ? parsedParts[0] : undefined),
                            addressParts[1] ?? parsedParts[3 <= parsedParts.length ? 1 : 0],
                            addressParts[2] ?? parsedParts[3 <= parsedParts.length ? 2 : 1]?.split(' ')[0],
                            addressParts[3] ?? parsedParts[3 <= parsedParts.length ? 3 : 2] ?? 'US'
                        ]
                    }
                }
            }
            result.city = addressParts[1]
            result.state = addressParts[2]
            result.country = addressParts[3]

            result.address = `${addressParts[0] ?? ''}, ${result.city}, ${result.state} ${scriptData.address.postalCode} ${result.country}`
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

    result.currencySymbol = '$'
    result.oceanGeodataSource = 'tl_2025_us_coastline'
    const href = scriptData.url
    result.href = () => href
    const img = Array.isArray(scriptData.image) ? scriptData.image[0] : scriptData.image
    result.serializedPicture = toScaledImgSerialized(img ? { src: img.url, width: img.width, height: img.height } : undefined, MaxPropertyInfoImageWidth)
    result.Picture = deserializeImg(result.serializedPicture, result)
    return result
}

async function scrapeListing(reportProgress: (progress: string) => void): Promise<PropertyInfo[]> {
    let tBegin = Date.now()
    const properties: PropertyInfo[] = []
    const elements = Array.from(await awaitQueryAll('div[class*="bp-Homecard "]')).filter(e => 0 < e.innerText.trim().length)
    const scriptData = Array.from(document.querySelectorAll('script'))
        .map(s => s.innerText)
        .filter(t => 0 < t.length && ['{\"@context\"', '[{\"@context\"'].some(prefix => t.startsWith(prefix)))
        .map(t => JSON.parse(t))
        .flat()
        .filter(data => !['BreadcrumbList', 'Product', 'Organization', 'Event'].includes(data['@type']))

    if (reportProgress) reportProgress(`Scraped ${scriptData.length
        } properties ${toDurationString(Date.now() - tBegin)} `)
    tBegin = Date.now()
    for (let i = 0; i < Math.min(elements.length, scriptData.length); i = i + 1) {
        const elementLines = elements[i].innerText.split('\n')
        const property: Partial<PropertyInfo> = scrapeScriptData(scriptData[i], elementLines)
        property.Price = property.Price ?? parseNumber(elementLines.find(p => p.startsWith('$')))
        property.Bathrooms = property.Bathrooms ?? parseNumber(elementLines.find(p => (/^[\d\.]+\s*bath?/ig).test(p)))
        property.Bedrooms = property.Bedrooms ?? parseNumber(elementLines.find(p => (/^[\d\.]+\s*bed?/ig).test(p)))
        property.serializedElement = toSerializedElement({ queryAllPickItemChild: { queryAllString: 'div[class*="bp-Homecard "]', itemChildGrandchildIndexes: [i] } })
        property.element = deserializeElement(property.serializedElement)
        property.serializedPicture = toPictureSerialized(elements[i].querySelector('img'))
        property.Picture = deserializeImg(property.serializedPicture, property)

        properties.push(await geocodePropertyInfoCard(toPropertyInfoCard(property), reportProgress))
    }
    if (reportProgress) reportProgress(`Geocoded ${properties.length} properties ${toDurationString(Date.now() - tBegin)} `)

    return properties
}

export const RedfinSite: RealEstateSite = {
    name: 'Redfin',
    containerId: 'redfin-realestate-id',
    isSupported: (href: string): boolean => Object.values(RedfinSite.pages).some(page => page.isPage(href)),
    pages: {

        [PropertyPageType.Feed]: {
            pageType: PropertyPageType.Feed,
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
            scrapePage: async (reportProgress: (progress: string) => void, force?: boolean): Promise<PropertyInfo[]> => {
                const href = window.location.href
                const collectData = async (): Promise<PropertyInfo[]> => {
                    return [...(await scrapeListing(reportProgress))]
                }
                return cacheWrapper(RedfinSite.name, href, collectData, force)
            }
        },

        [PropertyPageType.Listing]: {
            pageType: PropertyPageType.Listing,
            isPage: (href: string): boolean => (
                null !== href.match(/^https:\/\/www.redfin.com\/(city|zipcode|neighborhood|chat).*/)
            ),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                (await awaitQuerySelection('div[class="ExposedLayoutButtonContainer"]')).querySelector('button').click()
                const buttons = Array.from((await awaitQuerySelection('div[class*="ExposedLayoutMenu"]')).querySelectorAll('li[class="MenuItem"]'))
                    .reduce((obj, li) => ({ ...obj, [(li as HTMLElement).innerText]: li.querySelector('button') }), {} as LayoutMenuButtons)
                return [buttons.Map ?? buttons.Grid]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return element.tagName === 'BUTTON'
            },

            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (reportProgress: (progress: string) => void, force?: boolean): Promise<PropertyInfo[]> => {
                const href = window.location.href
                const collectData = async (): Promise<PropertyInfo[]> => {
                    return [...(await scrapeListing(reportProgress))]
                }
                return cacheWrapper(RedfinSite.name, href, collectData, force)
            }
        },

        [PropertyPageType.Single]: {
            pageType: PropertyPageType.Single,
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
            scrapePage: async (reportProgress: (progress: string) => void, force?: boolean): Promise<PropertyInfo[]> => {
                const href = window.location.href

                const collectData = async (): Promise<PropertyInfo[]> => {
                    const element: HTMLElement = await awaitQuerySelection('div[class="detailsContent"]')
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
                    return [await geocodePropertyInfoCard(toPropertyInfoCard(result), reportProgress)]
                }
                return cacheWrapper(RedfinSite.name, href, collectData, force)
            }
        }
    }
}
