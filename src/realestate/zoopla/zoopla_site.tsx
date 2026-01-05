import { PropertyInfo, toPropertyInfoCard, geocodePropertyInfoCard, MaxPropertyInfoImageWidth } from '../propertyinfotypes'
import { PropertyPageType, RealEstateSite } from '../realestatesitetypes'
import { parseNumber, toScaledImg } from '../propertypagefunctions'

import { awaitQuerySelection, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'
import { ReactNode } from 'react'
import { Button } from 'primereact/button'

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
    const result: Partial<PropertyInfo> = {}
    result.isLand = scriptData.propertyType === 'land'
    result.oceanGeodataSource = 'ITL2_JAN_2025_UK'
    result.Type = scriptData.propertyType
    result.address = scriptData.address
    result.city = result.address.split(', ')[1]
    result.state = result.address.split(', ')[2].split(' ')[0]
    result.country = 'United Kingdom'
    if (scriptData.pos) {
        result.coordinate = {
            lat: scriptData.pos.lat,
            lon: scriptData.pos.lng
        }
    }
    if (!result.isLand) {
        result.Bedrooms = scriptData.features.filter(({iconId}) => iconId.includes('bed'))[0]?.content
        result.Bathrooms = scriptData.features.filter(({iconId}) => iconId.includes('bath'))[0]?.content
    }
    const href = `https://www.zoopla.co.uk/${scriptData.listingUris.detail}`
    result.href = () => href
    result.Price = parseNumber(scriptData.price)
    result.Picture = toScaledImg({ src: scriptData.image.src, width: 244, height: 252 }, MaxPropertyInfoImageWidth, result)
    return result
}
const srcSetCoordinateRegex = new RegExp(/.*\/([-\.\d]+),([-\.\d]+).*/g)
function scrapeScriptSingleData(scriptData: ScriptSingleData, address: string, srcset: string): Partial<PropertyInfo> {
    const result: Partial<PropertyInfo> = {}
    result.isLand = scriptData['@type'] === 'land'
    result.oceanGeodataSource = 'ukcp18_uk_marine_coastline_hires'
    result.Type = scriptData['@type']
    if (!result.isLand) {
        result.Bedrooms = parseNumber(scriptData.additionalProperty.filter(({name}) => name.includes('Bed'))[0]?.value)
        result.Bathrooms = parseNumber(scriptData.additionalProperty.filter(({name}) => name.includes('Bath'))[0]?.value)
    }
    const href = scriptData.mainEntityOfPage
    result.href = () => href
    result.Price = scriptData.offers.price
    result.address = address
    result.city = result.address.split(', ')[1]
    result.state = result.address.split(', ')[2].split(' ')[0]
    result.country = 'United Kingdom'
    const parsedSrcSet = srcSetCoordinateRegex.exec(srcset)
    if (parsedSrcSet) {
        result.coordinate = {
            lat: parseNumber(parsedSrcSet[2]),
            lon: parseNumber(parsedSrcSet[1]),
        }
    }
    result.Picture = toScaledImg({ src: scriptData.image, width: 800, height: 533 }, MaxPropertyInfoImageWidth, result)
    return result
}

export const ZooplaSite: RealEstateSite = {
    name: 'Zoopla',
    containerId: 'zoopla-realestate-id',
    isSupported: (href: string): boolean => Object.values(ZooplaSite.pages).some(page => page.isPage(href)),
    pages: {
        [PropertyPageType.Listing]: {
            pageType: PropertyPageType.Listing,
            isPage: (href: string): boolean => href.startsWith('https://www.zoopla.co.uk/for-sale/map/property/'),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitQuerySelection('div[data-testid="header"]')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const List = document.querySelector('a[data-testid="list-view-button"]') as HTMLElement
                const Map = document.querySelector('button[data-testid="map-view-link"]') as HTMLElement
                return [List ? List : Map]
            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return ['list-view-button','map-view-link'].includes(element.dataset.testid)
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (): Promise<PropertyInfo[]> => {
                const properties: PropertyInfo[] = []
                for (const scriptData of Array.from(document.querySelectorAll('script[id="__NEXT_DATA__"]')).map((s: HTMLElement) => JSON.parse(s.innerText).props.pageProps.listings).flat()) {
                    properties.push(await geocodePropertyInfoCard(toPropertyInfoCard(scrapeScriptData(scriptData))))
                }
                return properties
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
            scrapePage: async (): Promise<PropertyInfo[]> => {
                const result: Partial<PropertyInfo> = scrapeScriptSingleData(
                    Array.from(document.querySelectorAll('script')).filter(e => e.innerText.startsWith('{\"@context\"')).map(e => JSON.parse(e.innerText)).slice(-1)[0],
                    Array.from(document.querySelectorAll('address'))[0].innerText,
                    Array.from(document.querySelectorAll('source')).filter(e => e.srcset.startsWith('https://maps.zoopla.co.uk/styles/portal/static/')).map(e => e.srcset)[0]
                )
                const mapBtns = Array.from(document.querySelectorAll('button')).filter(e => ['Map'].includes(e.innerText))
                if (1 === mapBtns.length) {
                    const mapClassName = Array.from(mapBtns[0].parentElement.classList).join(' ')
                    result.createMapButton = (text: string, onClick: () => void): ReactNode => (
                        <Button
                            title={text}
                            className={`app-button ${mapClassName}`}
                            onClick={onClick}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 0,
                                margin: 0,
                            }}
                        >
                            <div
                                title={text}
                                className={'map'}
                            />
                            <span
                                className={'text-center'}
                            >{text}</span>
                        </Button>
                    )
                }

                return [await geocodePropertyInfoCard(toPropertyInfoCard(result))]
            }
        },
    }
}