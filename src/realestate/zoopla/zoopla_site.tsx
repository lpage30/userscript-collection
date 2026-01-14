import {
    PropertyInfo,
    MaxPropertyInfoImageWidth
} from '../propertyinfotypes'
import {
    toCreateButtonFunction,
    toPropertyInfoCard,
    geocodePropertyInfoCard,
} from '../propertyinfotype_functions'

import { PropertyPageType, RealEstateSite } from '../realestatesitetypes'
import { parseNumber } from '../../common/functions'
import { toScaledImgSerialized, toSerializedImg, deserializeImg, toSerializedElement, deserializeElement } from '../serialize_deserialize_functions'
import { parseAddress } from '../../geocoding/datatypes'
import { toDurationString } from '../../common/datetime'

import { awaitQuerySelection, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'
import { cacheWrapper } from '../propertyinfocache'

interface ScriptFeature {
    content: number
    iconId: string
}
interface ScriptData {
    'address'?: string
    'features': ScriptFeature[]
    'image': {
        'caption': any
        'responsiveImgList': any
        'src': string
    },
    'listingId': string
    'listingUris': {
        'contact': any
        'detail': string
        'success': any
    }
    'pos': {
        'lat': number
        'lng': number
    }
    'price': string
    'propertyType': string

    'alternativeLabel': any
    'availableFrom': any
    'availableFromLabel': any
    'branch': any
    'derivedBuyerIncentives': any
    'displayType': any
    'featuredType': any
    'flag': any
    'gallery': any
    'highlights'?: any
    'isFavourite': any
    'isPremium': any
    'lastPublishedDate': any
    'listingType': any
    'numberOfFloorPlans': any
    'numberOfImages': any
    'numberOfVideos': any
    'priceCurrency': any
    'priceDrop': any
    'priceTitle': any
    'publishedOn': any
    'publishedOnLabel': any
    'shortPriceTitle': any
    'summaryDescription': any
    'tags': any
    'title': any
    'transports': any
    'underOffer': any
}
interface ScriptAdditionalProperty {
    'name': string
    'value': string
    '@type': any
}
interface ScriptOffer {
    '@type': any
    'availability': any
    'priceCurrency': any
    'price': number

}
interface ScriptSingleData {
    '@type': string
    'additionalProperty': ScriptAdditionalProperty[]
    'image': string
    'mainEntityOfPage': string
    'offers': ScriptOffer

    '@context': any
    'datePosted': any
    'description': any
    'name': any
    'potentialAction': any

}
function scrapeScriptData(scriptData: ScriptData): Partial<PropertyInfo> {
    const result: Partial<PropertyInfo> = {
        source: 'zoopla.co.uk',
        currencySymbol: '\u00A3',
        oceanGeodataSource: 'ukcp18_uk_marine_coastline_hires',
        isLand: scriptData.propertyType === 'land',
        Type: scriptData.propertyType,
        ...parseAddress(scriptData.address),
        country: 'United Kingdom',
    }

    if (scriptData.pos) {
        result.coordinate = {
            lat: scriptData.pos.lat,
            lon: scriptData.pos.lng
        }
    }
    if (!result.isLand) {
        result.Bedrooms = scriptData.features.filter(({ iconId }) => iconId.includes('bed'))[0]?.content
        result.Bathrooms = scriptData.features.filter(({ iconId }) => iconId.includes('bath'))[0]?.content
    }
    const href = `https://www.zoopla.co.uk/${scriptData.listingUris.detail}`
    result.href = () => href
    result.Price = parseNumber(scriptData.price)
    result.serializedPicture = toSerializedImg(scriptData.image ? { src: scriptData.image.src } : undefined)
    result.Picture = deserializeImg(result.serializedPicture, result)
    result.serializedElement = toSerializedElement({ elementId: `listing_${scriptData.listingId}` })
    result.element = deserializeElement(result.serializedElement)
    return result
}
const srcSetCoordinateRegex = new RegExp(/.*\/([-\.\d]+),([-\.\d]+).*/g)
function scrapeScriptSingleData(scriptData: ScriptSingleData, address: string, srcset: string): Partial<PropertyInfo> {
    const result: Partial<PropertyInfo> = {
        source: 'zoopla.co.uk',
        currencySymbol: '\u00A3',
        oceanGeodataSource: 'ukcp18_uk_marine_coastline_hires',
        isLand: scriptData['@type'] === 'land',
        Type: scriptData['@type'],
        ...parseAddress(address),
        country: 'United Kingdom',
    }
    if (!result.isLand) {
        result.Bedrooms = parseNumber(scriptData.additionalProperty.filter(({ name }) => name.includes('Bed'))[0]?.value)
        result.Bathrooms = parseNumber(scriptData.additionalProperty.filter(({ name }) => name.includes('Bath'))[0]?.value)
    }
    const href = scriptData.mainEntityOfPage
    result.href = () => href
    result.Price = scriptData.offers.price
    const parsedSrcSet = srcSetCoordinateRegex.exec(srcset)
    if (parsedSrcSet) {
        result.coordinate = {
            lat: parseNumber(parsedSrcSet[2]),
            lon: parseNumber(parsedSrcSet[1]),
        }
    }
    result.serializedPicture = toScaledImgSerialized(scriptData.image ? { src: scriptData.image, width: 800, height: 533 } : undefined, MaxPropertyInfoImageWidth)
    result.Picture = deserializeImg(result.serializedPicture, result)
    return result
}

export const ZooplaSite: RealEstateSite = {
    name: 'Zoopla',
    containerId: 'zoopla-realestate-id',
    isSupported: (href: string): boolean => Object.values(ZooplaSite.pages).some(page => page.isPage(href)),
    pages: {
        /*https://www.zoopla.co.uk/for-sale*/
        [PropertyPageType.Listing]: {
            pageType: PropertyPageType.Listing,
            isPage: (href: string): boolean => href.startsWith('https://www.zoopla.co.uk/for-sale') && !ZooplaSite.pages[PropertyPageType.Single].isPage(href),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitQuerySelection('div[data-testid="header"]')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const mapViewTagName = window.location.href.startsWith('https://www.zoopla.co.uk/for-sale/map')
                    ? 'button' : 'a'
                const List = document.querySelector('a[data-testid="list-view-button"]') as HTMLElement
                const Map = document.querySelector(`${mapViewTagName}[data-testid="map-view-link"]`) as HTMLElement
                return [List ? List : Map]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return ['list-view-button', 'map-view-link'].includes(element.dataset.testid)
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (reportProgress?: (progress: string) => void): Promise<PropertyInfo[]> => {
                const href = window.location.href
                const collectData = async (): Promise<PropertyInfo[]> => {
                    const result: PropertyInfo[] = []
                    const regexReplacements: [RegExp, string][] = [
                        [/\{\\"/g, '{"'],
                        [/\\"\}/g, '"}'],
                        [/\[\\"/g, '["'],
                        [/\\"]/g, '"]'],
                        [/:\\"/g, ':"'],
                        [/\\":/g, '":'],
                        [/,\\"/g, ',"'],
                        [/\\",/g, '",']
                    ]
                    const scriptDataArray: ScriptData[] =
                        window.location.href.startsWith('https://www.zoopla.co.uk/for-sale/map')
                            ? Array.from(document.querySelectorAll('script[id="__NEXT_DATA__"]'))
                                .map((s: HTMLElement) => JSON.parse(s.innerText)
                                    .props.pageProps.listings
                                ).flat()
                            : Array.from(document.querySelectorAll('script'))
                                .map(e => e.innerText)
                                .filter(t => t.includes('lng'))
                                .map(t => JSON.parse(
                                    regexReplacements.reduce(
                                        (jsonString, [regex, replacement]) =>
                                            jsonString.replace(regex, replacement),
                                        /^self.__next_f.push\(\[\d,[^\[]*(.*)\\n\"\]\)/.exec(t)[1]
                                    )
                                ))[0][3].regularListingsFormatted
                    if (reportProgress) reportProgress(`Scraped ${scriptDataArray.length} properties ${toDurationString(Date.now() - tBegin)}`)
                    const tBegin = Date.now()
                    for (const scriptData of scriptDataArray) {
                        result.push(await geocodePropertyInfoCard(toPropertyInfoCard(scrapeScriptData(scriptData)), reportProgress))
                    }
                    return result
                }
                return cacheWrapper(ZooplaSite.name, href, collectData)

            },

        },
        [PropertyPageType.Single]: {
            pageType: PropertyPageType.Single,
            isPage: (href: string): boolean => [
                'https://www.zoopla.co.uk/for-sale/details',
                'https://www.zoopla.co.uk/new-homes/details',
            ].some(prefix => href.startsWith(prefix)),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitElementById('main-content')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const mapButtons: HTMLElement[] = Array.from(document.querySelectorAll('button')).filter(e => ['Map'].includes(e.innerText))
                const fakeButton: HTMLElement = {
                    ...mapButtons[0],
                    click: () => history.back()
                }
                return [1 === mapButtons.length ? mapButtons[0] : fakeButton]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return false
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (reportProgress?: (progress: string) => void): Promise<PropertyInfo[]> => {
                const href = window.location.href
                const collectData = async (): Promise<PropertyInfo[]> => {
                    const result: Partial<PropertyInfo> = scrapeScriptSingleData(
                        Array.from(document.querySelectorAll('script')).filter(e => e.innerText.startsWith('{\"@context\"')).map(e => JSON.parse(e.innerText)).slice(-1)[0],
                        Array.from(document.querySelectorAll('address'))[0].innerText,
                        Array.from(document.querySelectorAll('source')).filter(e => e.srcset.startsWith('https://maps.zoopla.co.uk/styles/portal/static/')).map(e => e.srcset)[0]
                    )
                    result.serializedElement = toSerializedElement({
                        elementIdPickChild: {
                            elementId: 'main-content',
                            childGrandchildIndexes: [0, 0]
                        }
                    })
                    result.element = deserializeElement(result.serializedElement)
                    const mapBtns = Array.from(document.querySelectorAll('button')).filter(e => ['Map'].includes(e.innerText))
                    if (1 === mapBtns.length) {
                        result.createMapButton = toCreateButtonFunction()
                    }
                    return [await geocodePropertyInfoCard(toPropertyInfoCard(result), reportProgress)]
                }
                return cacheWrapper(ZooplaSite.name, href, collectData)
            }
        },
    }
}