import { PropertyInfo } from './propertyinfotypes'

export enum PropertyPageType {
    Listing = 0,
    Single = 1,
    Saved = 2,
}
export const propertyPageTypeString = (type: PropertyPageType): string => {
    switch (type) {
        case PropertyPageType.Listing: return 'Property Listing'
        case PropertyPageType.Saved: return 'Saved Properties'
        default: return 'Single Property'
    }
}
export interface ScrapedProperties {
    properties: Partial<PropertyInfo>[]
    containsOlderResults: boolean
}
export interface GeocodedScrapedProperties {
    properties: PropertyInfo[]
    containsOlderResults: boolean
}
export interface RealestatePage {
    pageType: PropertyPageType
    containsOlderResults: boolean
    isPage: (href: string) => boolean;
    isMapToggleElement: (element: HTMLElement) => boolean
    awaitForPageLoad: () => Promise<void>
    insertContainerOnPage: (container: HTMLElement) => Promise<void>
    scrapePage: (reportProgress: (progress: string) => void, includeOlderResults?: boolean) => ScrapedProperties
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
