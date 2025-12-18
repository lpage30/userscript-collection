import { PropertyInfo, RealEstateSite, MaxPropertyInfoImageWidth } from '../realestate_site'
import { awaitQuerySelection } from '../../common/await_functions'
import { ReactNode } from 'react'
import { Button } from 'primereact/button'
import { getHeightWidth, scaleDimension } from '../../common/ui/style_functions'

export const RealtorSite: RealEstateSite = {
    name: 'Realtor',
    containerId: 'realtor-realestate-id',
    isSupported: (href: string): boolean => {
        return RealtorSite.listingPage.isListingPage(href) || RealtorSite.singlePropertyPage.isSinglePropertyPage(href)
    },
    feedPage: undefined,
    listingPage: {
        isListingPage: (href: string): boolean => href.startsWith('https://www.realtor.com/realestateandhomes-search'),
        getListingPageMapToggleElement: async (): Promise<HTMLElement> => {
            const List = document.querySelector('button[data-testid="map-to-list-view-toggle"]') as HTMLElement
            const Map = document.querySelector('button[data-testid="list-to-map-view-toggle"]') as HTMLElement
            return List.ariaPressed === 'false' ? List : Map
        },
        insertContainerOnListingPage: async (container: HTMLElement): Promise<void> => {
            document.body.insertBefore(container, document.body.firstElementChild)
        }
    },
    singlePropertyPage: {
        isSinglePropertyPage: (href: string): boolean => href.startsWith('https://www.realtor.com/realestateandhomes-detail'),
        getSinglePageMapToggleElement: async (): Promise<HTMLElement> => {
            const List = document.querySelector('button[aria-label="close"]') as HTMLElement
            const MapSvg = document.querySelector('svg[data-testid="listing-summary-map__container"]') as HTMLElement
            const Map = document.querySelector('button[data-testid="map-snapshot-map-btn"]') as HTMLElement
            return List ?? Map ?? MapSvg
        },
        insertContainerOnSinglePropertyPage: async (container: HTMLElement): Promise<void> => {
            document.body.insertBefore(container, document.body.firstElementChild)
        },
        scrapeSinglePropertyPage: async (): Promise<PropertyInfo> => {
            const price = (await awaitQuerySelection('div[data-testid="ldp-list-price"]')).innerText
            const homeInfo = Array.from(document.querySelector('div[data-testid="ldp-home-facts"]').querySelectorAll('li'))
                .map(e => e.innerText.split('\n').map(v => v.trim()).filter(v => 0 < v.length))
                .reduce((info, valueName) => {
                    const value = valueName[0]
                    const name = valueName.slice(-1)[0]
                    const newInfo: PropertyInfo = {}
                    if (name.includes('bed')) {
                        newInfo.Bedrooms = value
                    }
                    if (name.includes('bath')) {
                        newInfo.Bathrooms = value
                    }
                    if (name.includes('square feet')) {
                        newInfo.Sqft = value.split('sqft')[0]
                    }
                    return {
                        ...info,
                        ...newInfo
                    }
                }, {} as PropertyInfo)
            const facts = Array.from(document.querySelector('ul[data-testid="key-facts"]').querySelectorAll('li'))
                .map(e => e.innerText.split('\n').map(v => v.trim()).filter(v => 0 < v.length))
                .reduce((info, nameValue) => {
                    const name = nameValue[0]
                    const value = nameValue.slice(-1)[0]
                    const newInfo: PropertyInfo = {}
                    if (name.includes('Property type')) {
                        newInfo.Type = value
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
                        ...newInfo
                    }
                }, {} as PropertyInfo)
            const address = (document.querySelector('div[data-testid="address-line-ldp"]') as HTMLElement).innerText

            let Picture = undefined
            const img = document.querySelector('ul[data-testid="carousel-track"]').querySelector('li').querySelector('img')
            if (img) {
                const {width, height} = scaleDimension(getHeightWidth(img), MaxPropertyInfoImageWidth, true)
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

            return {
                Price: price,
                ...homeInfo,
                Address: address,
                ...facts,
                Picture,
                createMapButton,
            }
        }
    }
}