import { PropertyInfo, toPropertyInfoCard, RealEstateSite, MaxPropertyInfoImageWidth, PropertyPageType } from '../realestate_site'
import { awaitQuerySelection, awaitQueryAll, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'
import { ReactNode } from 'react'
import { Button } from 'primereact/button'
import { getHeightWidth, scaleDimension } from '../../common/ui/style_functions'

interface LayoutMenuButtons {
    Grid?: HTMLElement
    Map?: HTMLElement
    Split?: HTMLElement
    Table?: HTMLElement
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
            scrapePage: async (): Promise<PropertyInfo[]> => {
                return Array.from(await awaitQueryAll('div[class="FeedHomeCard"]'))
                    .map((e: HTMLElement): PropertyInfo => {
                        const img = e.querySelector('img')
                        const href = e.querySelector('a').href
                        const parts = e.innerText.split('\n')
                        const priceIndex = parts.findIndex(part => part.startsWith('$'))
                        const Bathrooms = parts[priceIndex + 2].split(' ')[0]
                        const isLand = [String.fromCharCode(8212), '-'].includes(Bathrooms)
                        const result = {
                            Status: parts.slice(0, priceIndex).join('|'),
                            Price: parts[priceIndex],
                            Bedrooms: parts[priceIndex + 1].split(' ')[0],
                            Bathrooms,
                            isLand,
                            Sqft: isLand ? undefined : parts[priceIndex + 3].split(' ')[0],
                            Address: parts[priceIndex + 4],
                            City: parts[priceIndex + 4].split(', ').slice(-2)[0],
                            State: parts[priceIndex + 4].split(', ').slice(-1)[0].split(' ')[0],
                            lotSize: isLand ? parts[priceIndex + 3].split(' ')[0] : undefined,
                            element: e,
                            href: () => href
                        }
                        const { width, height } = scaleDimension(getHeightWidth(img), MaxPropertyInfoImageWidth, true)
                        return toPropertyInfoCard({
                            ...result,
                            Picture: <img
                                src={img.src}
                                title={result.Address}
                                alt={result.Address}
                                className={img.className}
                                height={`${height}px`}
                                width={`${width}px`}
                            />
                        })
                    })
            },
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
            scrapePage: async (): Promise<PropertyInfo[]> => {
                return Array.from(await awaitQueryAll('div[class*="bp-Homecard "]'))
                    .map((e: HTMLElement): PropertyInfo => {
                        const href = e.querySelector('a').href
                        const img = e.querySelector('img')
                        const parts = e.innerText.split('\n')
                        const priceIndex = parts.findIndex(part => part.startsWith('$'))
                        const result: Partial<PropertyInfo> = {
                            Price: parts[priceIndex],
                            Bedrooms: parts[priceIndex + 1].split(' ')[0],
                            Bathrooms: parts[priceIndex + 2].split(' ')[0],
                            isLand: [String.fromCharCode(8212), '-'].includes(parts[priceIndex + 2].split(' ')[0]),
                            Sqft: parts[priceIndex + 3].split(' ')[0],
                            Address: parts[priceIndex + 4],
                            City: parts[priceIndex + 4].split(', ').slice(-2)[0],
                            State: parts[priceIndex + 4].split(', ').slice(-1)[0].split(' ')[0],
                            HOA: (parts[priceIndex + 5].split(' • ').find(p => p.includes('HOA')) ?? '-').split(' ')[0],
                            lotSize: (parts[priceIndex + 5].split(' • ').find(p => p.includes('lot')) ?? '-').split(' ')[0],
                            element: e,
                            href: () => href,
                        }
                        const { width, height } = scaleDimension(getHeightWidth(img), MaxPropertyInfoImageWidth, true)
                        return toPropertyInfoCard({
                            ...result,
                            Picture: <img
                                src={img.src}
                                title={result.Address}
                                alt={result.Address}
                                className={img.className}
                                height={`${height}px`}
                                width={`${width}px`}
                            />
                        })
                    })
            },
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
                const href = window.location.href
                const element = await awaitQuerySelection('div[class="detailsContent"]')
                const topStats = await awaitQuerySelection('div[class="top-stats"]')
                const price = (topStats.querySelector('div[class*="statsValue price"]') as HTMLElement).innerText
                const bedrooms = (topStats.querySelector('div[class*="beds-section"]') as HTMLElement).innerText.split('\n')[0]
                const bathrooms = (topStats.querySelector('div[class*="baths-section"]') as HTMLElement).innerText.split(' ')[0]
                const isLand = [String.fromCharCode(8212), '-'].includes(bathrooms)
                const sqft = (topStats.querySelector('div[class*="sqft-section"]') as HTMLElement).innerText.split('\n')[0]
                const address = (topStats.querySelector('h1[class*="full-address"]') as HTMLElement).innerText
                const city = address.split(', ').slice(-2)[0]
                const state = address.split(', ').slice(-1)[0].split(' ')[0]

                const facts = Array.from(await awaitQueryAll('div[class="keyDetails-value"]'))
                    .map((e: HTMLElement) => e.innerText.split('\n').map(v => v.trim()).filter(v => 0 < v.length))
                    .reduce((info, valueName) => {
                        const value = valueName[0]
                        const name = valueName.slice(-1)[0]
                        const newInfo: Partial<PropertyInfo> = {}
                        if (name.includes('Property Type')) {
                            newInfo.Type = value
                        }
                        if (name.includes('Year Built')) {
                            newInfo.Year = value
                        }
                        if (name.includes('HOA Dues')) {
                            newInfo.HOA = value
                        }
                        return {
                            ...info,
                            ...newInfo
                        }
                    }, {} as Partial<PropertyInfo>)

                let Picture = undefined
                const img = document.getElementById('MBImage').querySelector('img')
                if (img) {
                    const { width, height } = scaleDimension(getHeightWidth(img), MaxPropertyInfoImageWidth, true)

                    Picture = <img
                        src={img.src}
                        title={address}
                        alt={address}
                        className={img.className}
                        height={`${height}px`}
                        width={`${width}px`}
                    />
                }

                let createMapButton = undefined
                const imgBtn = document.querySelector('div[class*="static-map"]').querySelector('img')
                if (imgBtn) {
                    createMapButton = (text: string, onClick: () => void): ReactNode => (
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
                }

                return [toPropertyInfoCard({
                    isLand,
                    Price: price,
                    Bedrooms: bedrooms,
                    Bathrooms: bathrooms,
                    Sqft: isLand ? undefined : sqft,
                    lotSize: isLand ? sqft : undefined,
                    Address: address,
                    City: city,
                    State: state,
                    ...facts,
                    Picture,
                    createMapButton,
                    element,
                    href: () => href,
                })]
            }
        }
    }
}
