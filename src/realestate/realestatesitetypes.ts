import { PropertyInfo } from './propertyinfotypes'

export enum PropertyPageType {
    Feed = 0,
    Listing = 1,
    Single = 2,
}
export interface RealestatePage {
    pageType: PropertyPageType
    isPage: (href: string) => boolean;
    isMapToggleElement: (element: HTMLElement) => boolean
    awaitForPageLoad: () => Promise<void>
    insertContainerOnPage: (container: HTMLElement) => Promise<void>
    scrapePage: () => Promise<PropertyInfo[]>
    getMapToggleElements: (parentElement?: HTMLElement) => Promise<HTMLElement[]>
}
export interface RealEstateSite {
    name: string;
    containerId: string;
    isSupported: (href: string) => boolean;
    pages: {
        [pageType: number]: RealestatePage
    }
}

export function addressToMapUrl(address: string): string {
    const addressURL = `https://www.google.com/maps/search/?api=1&query=${address.replace(/\s+/g, '+')}`
    return addressURL
}
export function latlonToMapUrl(latitude: number, longitude: number): string {
    return addressToMapUrl(`${latitude.toFixed(7)},${longitude.toFixed(7)}`)
}
