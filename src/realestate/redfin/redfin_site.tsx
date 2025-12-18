import { PropertyInfo, RealEstateSite } from '../realestate_site'
import { awaitQuerySelection, awaitQueryAll } from '../../common/await_functions'
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
    isSupported: (href: string): boolean => {
        return RedfinSite.feedPage.isFeedPage(href) || RedfinSite.listingPage.isListingPage(href) || RedfinSite.singlePropertyPage.isSinglePropertyPage(href)
    },
    feedPage: {
        isFeedPage: (href: string): boolean => ('https://www.redfin.com/#userFeed' === href || 'https://www.redfin.com/' === href),
        getFeedPageMapToggleButtons: async (): Promise<HTMLElement[]> => Array.from(await awaitQueryAll('button[aria-label*="Toggle to "]')),
        insertContainerOnFeedPage: async (container: HTMLElement): Promise<void> => {
            document.body.insertBefore(container, document.body.firstElementChild)
        }
    },
    listingPage: {
        isListingPage: (href: string): boolean => (null !== href.match(/^https:\/\/www.redfin.com\/.*\/filter\/.*/)),
        getListingPageMapToggleElement: async (): Promise<HTMLElement> => {
            (await awaitQuerySelection('div[class="ExposedLayoutButtonContainer"]')).querySelector('button').click()
            const buttons = Array.from(document.querySelector('div[class*="ExposedLayoutMenu"]').querySelectorAll('li[class="MenuItem"]'))
                .reduce((obj, li) => ({ ...obj, [(li as HTMLElement).innerText]: li.querySelector('button') }), {} as LayoutMenuButtons)
            return buttons.Map ?? buttons.Grid
        },
        insertContainerOnListingPage: async (container: HTMLElement): Promise<void> => {
            document.body.insertBefore(container, document.body.firstElementChild)
        }
    },
    singlePropertyPage: {
        isSinglePropertyPage: (href: string): boolean => (null !== href.match(/^https:\/\/www.redfin.com\/.*\/home\/\d+$/)),
        getSinglePageMapToggleElement: (): Promise<HTMLElement> => awaitQuerySelection('div[class*="static-map"]'),
        insertContainerOnSinglePropertyPage: async (container: HTMLElement): Promise<void> => {
            document.body.insertBefore(container, document.body.firstElementChild)
        },
        scrapeSinglePropertyPage: async (): Promise<PropertyInfo> => {
            const topStats = await awaitQuerySelection('div[class="top-stats"]')
            const price = (topStats.querySelector('div[class*="statsValue price"]') as HTMLElement).innerText
            const bedrooms = (topStats.querySelector('div[class*="beds-section"]') as HTMLElement).innerText.split('\n')[0]
            const bathrooms = (topStats.querySelector('div[class*="baths-section"]') as HTMLElement).innerText.split(' ')[0]
            const sqft = (topStats.querySelector('div[class*="sqft-section"]') as HTMLElement).innerText.split('\n')[0]
            const address = (topStats.querySelector('h1[class*="full-address"]') as HTMLElement).innerText
            const facts = Array.from(document.querySelectorAll('div[class="keyDetails-value"]'))
                .map((e: HTMLElement) => e.innerText.split('\n').map(v => v.trim()).filter(v => 0 < v.length))
                .reduce((info, valueName) => {
                    const value = valueName[0]
                    const name = valueName.slice(-1)[0]
                    const newInfo: PropertyInfo = {}
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
                }, {} as PropertyInfo)
            
            let Picture = undefined
            const img = document.getElementById('MBImage').querySelector('img')
            if (img) {
                const {width, height} = scaleDimension(getHeightWidth(img), 250, true)
                
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
                            alignItems: 'center'
                        }}
                    >
                        <img 
                            src={imgBtn.src}
                            title={text}
                            alt={text}
                            className={'map-img'}
                        />
                        <span 
                            className={'text-center'}
                        >{text}</span>
                    </Button>
                )
            }

            return {
                Price: price,
                Bedrooms: bedrooms,
                Bathrooms: bathrooms,
                Sqft: sqft,
                Address: address,
                ...facts,
                Picture,
                createMapButton,
            }
        }
    }
}
