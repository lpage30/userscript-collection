import { ReactNode } from 'react'
import { Card } from '../dashboardcomponents/datatypes'
import { toHashCode, toNumber } from '../common/functions'
import { 
    GeoAddress, 
    GeoCountryStateCityAddress,
    Place,
    toGeoPlace,
    toCityStateCountryString,
    toGeoCountryStateCityAddressString,
    toPlaceString
} from '../geocoding/datatypes'
import { classifyGeoCountryStateCity, findClosestOceanPlace } from '../geocoding/geojsonService'

export interface GeoPropertyInfo {
    propertyPlace: GeoCountryStateCityAddress
    closestOceanPlace?: Place
    displayString: string
}

export interface PropertyInfo extends Card, GeoAddress {
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
    Picture?: ReactNode
    createMapButton?: (text: string, onClick: () => void) => ReactNode
    element?: HTMLElement
    PriceValue?: number
    DistanceToOcean?: number
    geoPropertyInfo?: GeoPropertyInfo
}
export function toPropertyInfoCard(data: Partial<PropertyInfo>): PropertyInfo {
    const property: Partial<PropertyInfo> = {}
    property.isLand = data.isLand
    property.Type = data.Type
    property.Year = data.Year
    property.HOA = data.HOA
    property.Garage = data.Garage
    property.Price = data.Price
    property.PriceValue = toNumber(data.Price)
    property.Bedrooms = data.Bedrooms
    property.Bathrooms = data.Bathrooms
    property.Sqft = data.Sqft
    property.lotSize = data.lotSize
    property.address = data.address
    property.city = data.city
    property.country = data.country
    property.state = data.state
    property.Picture = data.Picture
    property.createMapButton = data.createMapButton
    property.element = data.element
    property.coordinate = data.coordinate
    // InfoDisplay
    property.displayLines = () => [
        `${property.Price}@${property.address}`,
        `${property.Bedrooms} Beds, ${property.Bathrooms} baths`,
        `${property.Sqft} sqft`,
    ].filter(t => undefined !== t)

    // PicklistItem
    const href = data.href('')
    property.groupName = data.address
    property.label = () => property.address
    property.color = () => 'white'
    property.href = () => href
    property.elementId = toHashCode(href)
    // Card
    property.renderable = property.element
    return property as PropertyInfo
}
export async function geocodePropertyInfoCard(data: PropertyInfo): Promise<PropertyInfo> {
    if (data.geoPropertyInfo) return data

    const result: PropertyInfo = {...data}
    const displayLines = [...data.displayLines()]
    const propertyPlace: GeoCountryStateCityAddress =  classifyGeoCountryStateCity(data as GeoAddress)

    const closestOceanPlace: Place | undefined = await findClosestOceanPlace(toGeoPlace(propertyPlace))
    
    result.geoPropertyInfo = {
        propertyPlace,
        closestOceanPlace,
        displayString: `Ocean Location: ${closestOceanPlace ? toPlaceString(closestOceanPlace) : toGeoCountryStateCityAddressString(propertyPlace)}`
    }
    result.DistanceToOcean = closestOceanPlace ? Math.round(closestOceanPlace.distance.value) : undefined
    displayLines.push(result.geoPropertyInfo.displayString)
    result.displayLines = () => displayLines
    return result
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
