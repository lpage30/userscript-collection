import { ReactNode } from 'react'
import { Button } from 'primereact/button'
import { PropertyInfo, toPropertyInfoCard, geocodePropertyInfoCard, MaxPropertyInfoImageWidth } from '../propertyinfotypes'
import { RealEstateSite, PropertyPageType } from '../realestatesitetypes'
import { parseNumber, toScaledImg, toScaledPicture } from '../propertypagefunctions'
import { awaitQuerySelection, awaitQueryAll, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'
import { getHeightWidth, scaleDimension } from '../../common/ui/style_functions'

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
function scrapeScriptData(scriptData: ScriptData): Partial<PropertyInfo> {
    const result: Partial<PropertyInfo> = scriptData.mainEntity
        ? scrapeScriptData(scriptData.mainEntity)
        : {}
    if (scriptData.mainEntity === undefined) {
        result.isLand = (scriptData.floorSize ?? {}).value === undefined
        result.Type = result.isLand ? 'land' : scriptData['@type'] as string
        if (scriptData.address) {
            result.country = scriptData.address.addressCountry
            result.state = scriptData.address.addressRegion
            result.city = scriptData.address.addressLocality
            result.address = `${scriptData.address.streetAddress}, ${result.city}, ${result.state} ${scriptData.address.postalCode} ${result.country}`
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
    result.oceanGeodataSource = 'tl_2025_us_coastline'
    const href = scriptData.url
    result.href = () => href
    const img = Array.isArray(scriptData.image) ? scriptData.image[0] : scriptData.image
    result.Picture = toScaledImg(img ? { src: img.url, width: img.width, height: img.height } : undefined, MaxPropertyInfoImageWidth, result)
    return result
}


async function scrapeListing(bpHomeCards: HTMLElement[]): Promise<PropertyInfo[]> {
    const properties: PropertyInfo[] = []
    for (const e of bpHomeCards) {
        const context = JSON.parse(e.querySelector('script').innerText)[0]
        const result: Partial<PropertyInfo> = scrapeScriptData(context)
        result.Price = parseNumber((e.querySelector('span[class*="bp-Homecard__Price--value"]') as HTMLElement).innerText)
        if (result.isLand) {
            result.lotSize = parseNumber((e.querySelector('span[class*="bp-Homecard__Stats--sqft"]') as HTMLElement).innerText)
        }
        result.element = e
        properties.push(await geocodePropertyInfoCard(toPropertyInfoCard(result)))
    }
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
                await awaitQuerySelection('div[class*="SeenEverythingFooter"]')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => {
                const toggleButtonSelector = 'button[aria-label*="Toggle to "]'
                if (undefined == parentElement) {
                    return Array.from(await awaitQueryAll(toggleButtonSelector))
                }
                return Array.from(parentElement.querySelectorAll(toggleButtonSelector))

            },
            isMapToggleElement: (element: HTMLElement): boolean => {
                return element.ariaLabel.startsWith('Toggle to')
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (): Promise<PropertyInfo[]> =>
                scrapeListing(Array.from(await awaitQueryAll('div[class*="bp-Homecard "]'))),

        },
        [PropertyPageType.Listing]: {
            pageType: PropertyPageType.Listing,
            isPage: (href: string): boolean => (null !== href.match(/^https:\/\/www.redfin.com\/(city|zipcode|neighborhood)\/.*/)),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitElementById('region-content')
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
            scrapePage: async (): Promise<PropertyInfo[]> =>
                scrapeListing(Array.from(await awaitQueryAll('div[class*="bp-Homecard "]'))),
        },
        [PropertyPageType.Single]: {
            pageType: PropertyPageType.Single,
            isPage: (href: string): boolean => (null !== href.match(/^https:\/\/www.redfin.com\/.*\/home\/\d+$/)),
            awaitForPageLoad: async (): Promise<void> => {
                await awaitPageLoadByMutation()
                await awaitQuerySelection('div[class*="AskGeneralInquirySection"]')
            },
            getMapToggleElements: async (parentElement?: HTMLElement): Promise<HTMLElement[]> => [await awaitQuerySelection('div[class*="static-map"]')],
            isMapToggleElement: (element: HTMLElement): boolean => {
                return Array.from(element.classList).some(name => name === 'static-map')
            },
            insertContainerOnPage: async (container: HTMLElement): Promise<void> => {
                document.body.insertBefore(container, document.body.firstElementChild)
            },
            scrapePage: async (): Promise<PropertyInfo[]> => {
                const element: HTMLElement = await awaitQuerySelection('div[class="detailsContent"]')
                const result: Partial<PropertyInfo> = scrapeScriptData(JSON.parse(
                    Array.from(element.querySelectorAll('script'))
                        .filter(s => s.innerText.startsWith('{\"@context\"'))[0].innerText
                ))
                result.element = document.querySelector('div[class="detailsContent"]')
                result.Picture = toScaledPicture(
                    document.getElementById('MBImage').querySelector('img'),
                    MaxPropertyInfoImageWidth,
                    result
                ) ?? result.Picture

                const imgBtn = document.querySelector('div[class*="static-map"]').querySelector('img')
                if (imgBtn) {
                    result.createMapButton = (text: string, onClick: () => void): ReactNode => (
                        <Button
                            title={text}
                            className={`app-button`}
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
                                className={'static-map v2 addressBannerRevamp'}
                            >
                                <img
                                    src={imgBtn.src}
                                    title={text}
                                    alt={text}
                                    className={Array.from(imgBtn.classList).join(' ')}
                                    height={`${MaxPropertyInfoImageWidth}px`}
                                    width={`${MaxPropertyInfoImageWidth}px`}
                                />
                                <div
                                    className={Array.from(imgBtn.nextElementSibling.classList).join(' ')}
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        width: `${Math.round(12 / 200 * MaxPropertyInfoImageWidth)}px`,
                                        height: `${Math.round(12 / 200 * MaxPropertyInfoImageWidth)}px`,
                                        marginTop: `-${Math.round(30 / 200 * MaxPropertyInfoImageWidth)}px`,
                                        marginLeft: `-${Math.round(15 / 200 * MaxPropertyInfoImageWidth)}px`,
                                    }}
                                >
                                    <svg
                                        className={Array.from(imgBtn.nextElementSibling.firstElementChild.classList).join(' ')}
                                        style={{
                                            height: `${Math.round(32 / 200 * MaxPropertyInfoImageWidth)}px`,
                                            width: `${Math.round(30 / 200 * MaxPropertyInfoImageWidth)}px`,
                                        }}
                                    >
                                        <svg
                                            viewBox={`0 0 ${Math.round(24 / 200 * MaxPropertyInfoImageWidth)} ${Math.round(24 / 200 * MaxPropertyInfoImageWidth)}`}
                                        >
                                            <path
                                                fillRule={'evenodd'}
                                                clipRule={'evenodd'}
                                                d={'M20 10a8 8 0 10-16 0c0 3.219 1.957 6.205 3.741 8.284a27.431 27.431 0 002.498 2.542c.373.334.753.667 1.154.968a.99.99 0 001.233-.014c.066-.052.508-.405 1.144-.988a29.1 29.1 0 002.493-2.582C18.039 16.116 20 13.128 20 10zm-8-3a3 3 0 110 6 3 3 0 010-6z'}
                                            ></path>
                                        </svg>
                                    </svg>
                                </div>
                            </div>
                            <span
                                className={'text-center'}
                            >{text}</span>
                        </Button>
                    )
                    return [await geocodePropertyInfoCard(toPropertyInfoCard(result))]
                }
            }
        }
    }
}
