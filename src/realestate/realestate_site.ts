import { ReactNode } from 'react'
import { Card } from '../dashboardcomponents/datatypes'
import { toHashCode } from '../common/functions'

export interface PropertyInfo extends Card {
    isLand: boolean
    Type?: string
    Year?: string
    HOA?: string
    Garage?: string
    Price?: string
    Bedrooms?: string
    Bathrooms?: string
    Sqft?: string
    lotSize?: string
    Address?: string
    City?: string
    State?: string
    Picture?: ReactNode
    createMapButton?: (text: string, onClick: () => void) => ReactNode
    element?: HTMLElement
}
export function toPropertyInfoCard(data: Partial<PropertyInfo>): PropertyInfo {
    const property: Partial<PropertyInfo> = {}
    property.isLand = data.isLand
    property.Type = data.Type
    property.Year = data.Year
    property.HOA = data.HOA
    property.Garage = data.Garage
    property.Price = data.Price
    property.Bedrooms = data.Bedrooms
    property.Bathrooms = data.Bathrooms
    property.Sqft = data.Sqft
    property.lotSize = data.lotSize
    property.Address = data.Address
    property.City = data.City
    property.State = data.State
    property.Picture = data.Picture
    property.createMapButton = data.createMapButton
    property.element = data.element
    // InfoDisplay
    property.displayLines = () => [
        `${property.Price}@${property.Address}`,
        `${property.Bedrooms} Beds, ${property.Bathrooms} baths`,
        `${property.Sqft} sqft`
    ]
    // PicklistItem
    const href = data.href('')
    property.groupName = data.Address
    property.label = () => property.Address
    property.color = () => 'white'
    property.href = () => href
    property.elementId = toHashCode(href)
    property.renderable = property.element
    return property as PropertyInfo
}
export const MaxPropertyInfoImageWidth = 325
export enum PropertyPageType {
    Feed = 0,
    Listing = 1,
    Single = 2,
}
export interface RealestatePage {
    pageType: PropertyPageType
    isPage: (href: string) => boolean;
    isMapToggleElement: (element: HTMLElement) => boolean
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
