import { PropertyInfo, toPropertyInfoCard, RealEstateSite, MaxPropertyInfoImageWidth, PropertyPageType } from '../realestate_site'
import { awaitQueryAll, awaitQuerySelection, awaitPageLoadByMutation, awaitElementById } from '../../common/await_functions'
import { ReactNode } from 'react'
import { Button } from 'primereact/button'
import { getHeightWidth, scaleDimension } from '../../common/ui/style_functions'

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
            scrapePage: async (): Promise<PropertyInfo[]> => {
                const isRecommendedList = window.location.href.startsWith('https://www.realtor.com/recommended') as boolean
                const cards = Array.from(await awaitQueryAll(isRecommendedList ? 'div[data-testid="recommended-homes-card"]' : 'div[class="BasePropertyCard_propertyCardWrap__gtWK6"]'))
                return cards
                    .map((e: HTMLElement) => ({ e, img: e.querySelector('img'), a: e.querySelector('a') }))
                    .filter(({ img }) => img !== null)
                    .map(({ e, img, a }): PropertyInfo => {
                        const href = a.href
                        const parts = e.innerText.split('\n')
                        let index = parts.findIndex(part => part.startsWith('$'))
                        const result: Partial<PropertyInfo> = {
                            Type: parts[index - 1].split(' ')[0],
                            Price: parts[index],
                            href: () => href,
                        }
                        result.Bedrooms = parts[index + 1]
                        index = parts.findIndex(part => part.startsWith('bed'))
                        if (0 < index) {
                            result.Bedrooms = `${result.Bedrooms} parts[index - 1]`
                        }
                        index = parts.findIndex(part => part.startsWith('bath'))
                        result.isLand = index < 0
                        if (0 < index) {
                            result.Bathrooms = parts[index - 1]
                        }
                        index = parts.findIndex(part => part.includes('sqft'))
                        if (0 < index) {
                            result.Sqft = parts[index].split('sqft')[0]
                        }
                        index = parts.findIndex(part => part.includes('Email Agent'))
                        if (0 < index) {
                            result.City = parts[index - 1].split(', ').slice(-2)[0]
                            result.State = parts[index - 1].split(', ').slice(-2)[1]
                            result.Address = `${parts[index - 2]}, ${result.City}, ${result.State}`
                        }
                        index = parts.findIndex(part => part.includes('HOA'))
                        if (0 < index) {
                            result.HOA = (parts[index].split(' • ').find(p => p.includes('HOA')) ?? '-').split(' ')[0]
                        }
                        index = parts.findIndex(part => part.includes(' lot'))
                        if (0 < index) {
                            result.lotSize = parts[index].split(' lot')[0]
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
                            />,
                        })
                    })
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
            scrapePage: async (): Promise<PropertyInfo[]> => {
                const href = window.location.href
                const element = await awaitQuerySelection('div[data-testid="ldp-main-container"]')
                const price = (await awaitQuerySelection('div[data-testid="ldp-list-price"]')).innerText
                const homeInfo = Array.from((await awaitQuerySelection('div[data-testid="ldp-home-facts"]')).querySelectorAll('li'))
                    .map(e => e.innerText.split('\n').map(v => v.trim()).filter(v => 0 < v.length))
                    .reduce((info, valueName) => {
                        const value = valueName[0]
                        const name = valueName.slice(-1)[0]
                        const newInfo: Partial<PropertyInfo> = {}
                        if (value === 'Studio') {
                            newInfo.Bedrooms = value
                        }
                        if (name.includes('bed')) {
                            newInfo.Bedrooms = value
                        }
                        if (name.includes('bath')) {
                            newInfo.Bathrooms = value
                        }
                        if (name.includes('square feet')) {
                            newInfo.Sqft = value.split('sqft')[0]
                        }
                        if (name.includes(' lot')) {
                            newInfo.lotSize = value.split(' lot')[0]
                        }
                        return {
                            ...info,
                            ...newInfo
                        }
                    }, {} as Partial<PropertyInfo>)
                const facts = Array.from(document.querySelector('ul[data-testid="key-facts"]').querySelectorAll('li'))
                    .map(e => e.innerText.split('\n').map(v => v.trim()).filter(v => 0 < v.length))
                    .reduce((info, nameValue) => {
                        const name = nameValue[0]
                        const value = nameValue.slice(-1)[0]
                        const newInfo: Partial<PropertyInfo> = {}
                        if (name.includes('Property type')) {
                            newInfo.Type = value.split(' ')[0]
                        }
                        if (name.includes('Year built')) {
                            newInfo.Year = value
                        }
                        if (name.includes('HOA fees')) {
                            newInfo.HOA = value.split('/')[0]
                        }
                        if (name.includes('Garage')) {
                            newInfo.Garage = value
                        }
                        return {
                            ...info,
                            ...newInfo,
                        }
                    }, {} as PropertyInfo)
                const address = (document.querySelector('div[data-testid="address-line-ldp"]') as HTMLElement).innerText
                const city = address.split(', ')[1]
                const state = address.split(', ')[2].split(' ')[0]

                let Picture = undefined
                const img = document.querySelector('ul[data-testid="carousel-track"]').querySelector('li').querySelector('img')
                if (img) {
                    const { width, height } = scaleDimension(getHeightWidth(img), MaxPropertyInfoImageWidth, true)
                    Picture = <img
                        src={img.src}
                        title={address}
                        alt={address}
                        height={`${height}px`}
                        width={`${width}px`}
                    />
                }

                let createMapButton = undefined
                const mapBtn = await awaitQuerySelection('button[data-testid="map-snapshot-map-btn"]')
                if (mapBtn) {
                    const mapClassName = Array.from(mapBtn.parentElement.classList).join(' ')
                    createMapButton = (text: string, onClick: () => void): ReactNode => (
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

                return [toPropertyInfoCard({
                    isLand: [null, undefined].includes(homeInfo.Bathrooms),
                    Price: price,
                    ...homeInfo,
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
        },
    }
}