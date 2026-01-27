import {
    PropertyInfo,
    MaxPropertyInfoImageWidth
} from '../propertyinfotypes'
import {
    toCreateButtonFunction,
} from '../propertyinfotype_functions'

import { PropertyPageType, RealEstateSite, ScrapedProperties } from '../realestatesitetypes'
import { parseNumber } from '../../common/functions'
import { toPictureSerialized, toScaledImgSerialized, toSerializedImg, deserializeImg, toSerializedElement, deserializeElement } from '../serialize_deserialize_functions'
import { CountryAddress, GeodataSourceType } from '../../geocoding/datatypes'
import { parseAddress } from '../../geocoding/geocoding_api/address_parser'
import { toDurationString } from '../../common/datetime'

import { awaitQuerySelection, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'

const source = 'zoopla.co.uk'
const oceanGeodataSource: GeodataSourceType = 'ukcp18_uk_marine_coastline_hires'
const currencySymbol = '\u00A3'
const countryAddress: CountryAddress = {
    name: 'United Kingdom',
    codes: ['UK', 'GB']
}


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
        source,
        currencySymbol,
        oceanGeodataSource,
        isLand: scriptData.propertyType === 'land',
        Type: scriptData.propertyType,
        ...parseAddress(scriptData.address, countryAddress),
        Status: 'ForSale',
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
        source,
        currencySymbol,
        oceanGeodataSource,
        isLand: scriptData['@type'] === 'land',
        Type: scriptData['@type'],
        ...parseAddress(address, countryAddress),
        Status: 'ForSale',
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
        [PropertyPageType.Listing]: {
            pageType: PropertyPageType.Listing,
            containsOlderResults: false,
            isPage: (href: string): boolean => href.startsWith('https://www.zoopla.co.uk/for-sale') && !ZooplaSite.pages[PropertyPageType.Single].isPage(href),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitQuerySelection('div[data-testid="header"]')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const mapViewTagName = window.location.href.startsWith('https://www.zoopla.co.uk/for-sale/map')
                    ? 'button' : 'a'
                const List = (parentElement ?? document).querySelector('a[data-testid="list-view-button"]') as HTMLElement
                const Map = (parentElement ?? document).querySelector(`${mapViewTagName}[data-testid="map-view-link"]`) as HTMLElement
                return [List ? List : Map]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return ['list-view-button', 'map-view-link'].includes(element.dataset.testid)
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: (reportProgress: (progress: string) => void, includeOlderResults?: boolean): ScrapedProperties => {
                const href = window.location.href
                const tBegin = Date.now()
                const result: Partial<PropertyInfo>[] = []
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
                for (const scriptData of scriptDataArray) {
                    result.push(scrapeScriptData(scriptData))
                }
                if (reportProgress) reportProgress(`Scraped ${result.length} properties ${toDurationString(Date.now() - tBegin)}`)
                return {
                    properties: result,
                    containsOlderResults: false
                }
            },
        },
        [PropertyPageType.Saved]: {
            pageType: PropertyPageType.Saved,
            containsOlderResults: false,
            isPage: (href: string): boolean => href.startsWith('https://www.zoopla.co.uk/favourites'),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                return []
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return false
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: (reportProgress: (progress: string) => void, includeOlderResults?: boolean): ScrapedProperties => {
                const href = window.location.href
                const tBegin = Date.now()
                const results: Partial<PropertyInfo>[] = []
                Array.from(document.querySelectorAll('div[class*="Card_cardContainer"]')).forEach((e: HTMLElement, index) => {
                    const result: Partial<PropertyInfo> = {
                        source,
                        oceanGeodataSource,
                        currencySymbol
                    }
                    result.serializedElement = toSerializedElement({ queryAllPickItemChild: { queryAllString: 'div[class*="Card_cardContainer"]', itemChildGrandchildIndexes: [index] } })
                    result.element = deserializeElement(result.serializedElement)
                    result.serializedPicture = toPictureSerialized(e.querySelector('img'))
                    result.Picture = deserializeImg(result.serializedPicture, result)
                    result.Status = 'ForSale'
                    const cardDetail: HTMLElement = e.querySelector('div[class*="ListingCard_listingCardDetailGrid"]')

                    const addressHrefDetail: HTMLAnchorElement = cardDetail.querySelector('a')
                    const href = addressHrefDetail.href
                    const address = parseAddress(addressHrefDetail.innerText, countryAddress)
                    result.href = () => href
                    result.address = address.address
                    result.city = address.city
                    result.state = address.state
                    result.country = address.country
                    result.isLand = (addressHrefDetail.previousElementSibling as HTMLElement).innerText.includes('Land')

                    const priceDetail: HTMLDivElement = cardDetail.querySelector('div[class*="ListingCard_priceText"]')
                    result.Price = parseNumber(priceDetail.innerText)

                    const featureList = cardDetail.querySelector('ul[data-name="feature-list"]')
                    Array.from(featureList ? featureList.querySelectorAll('li') : []).forEach(li => {
                        if (li.dataset.testid.includes('bed')) {
                            result.Bedrooms = parseNumber(li.innerText)
                            return
                        }
                        if (li.dataset.testid.includes('bath')) {
                            result.Bathrooms = parseNumber(li.innerText)
                            return
                        }
                    })
                    results.push(result)

                })
                if (reportProgress) reportProgress(`Scraped ${results.length} properties ${toDurationString(Date.now() - tBegin)}`)
                return {
                    properties: results,
                    containsOlderResults: false
                }
            },

        },
        [PropertyPageType.Single]: {
            pageType: PropertyPageType.Single,
            containsOlderResults: false,
            isPage: (href: string): boolean => [
                'https://www.zoopla.co.uk/for-sale/details',
                'https://www.zoopla.co.uk/new-homes/details',
            ].some(prefix => href.startsWith(prefix)),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitElementById('main-content')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const mapButtons: HTMLElement[] = Array.from((parentElement ?? document).querySelectorAll('button')).filter(e => ['Map'].includes(e.innerText))
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
            scrapePage: (reportProgress: (progress: string) => void, includeOlderResults?: boolean): ScrapedProperties => {
                const href = window.location.href
                const tBegin = Date.now()
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
                if (reportProgress) reportProgress(`Scraped 1 property ${toDurationString(Date.now() - tBegin)}`)

                return {
                    properties: [result],
                    containsOlderResults: false
                }
            }
        },
    }
}