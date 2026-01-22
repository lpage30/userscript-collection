import { JSX, ReactNode } from 'react'
import { Card } from '../dashboardcomponents/datatypes'
import {
    GeoAddress,
    GeoAddressField,
    GeoCoordinate,
    GeodataSourceType
} from '../geocoding/datatypes'
import {
    PlaceDistance,
    GeocodedCountryStateCityAddress
} from '../geocoding/geocodedcountrystatecitytypes'

export const MaxPropertyInfoImageWidth = 325
export interface GeoPropertyInfo {
    propertyPlace: GeocodedCountryStateCityAddress
    closestOceanPlace?: PlaceDistance
    displayString: string
}

interface LabelColorHref {
    label: string
    color: string
    href: string
}
export enum PropertyDetailsField {
    source = 'source',
    currencySymbol = 'currencySymbol',
    oceanGeodataSource = 'oceanGeodataSource',
    isLand = 'isLand',
    Type = 'Type',
    Year = 'Year',
    HOA = 'HOA',
    Garage = 'Garage',
    Price = 'Price',
    Bedrooms = 'Bedrooms',
    Bathrooms = 'Bathrooms',
    Sqft = 'Sqft',
    lotSize = 'lotSize',
    coordinate = 'coordinate',
    DistanceToOcean = 'DistanceToOcean',
    geoPropertyInfo = 'geoPropertyInfo',
    elementId = 'elementId',
}
export const PropertyDetailsFields = {
    ...GeoAddressField,
    ...PropertyDetailsField
}
export interface PropertyDetails extends GeoAddress {
    [PropertyDetailsField.source]: string
    [PropertyDetailsField.currencySymbol]: string,
    [PropertyDetailsField.oceanGeodataSource]: GeodataSourceType
    [PropertyDetailsField.isLand]: boolean
    [PropertyDetailsField.Type]?: string
    [PropertyDetailsField.Year]?: number
    [PropertyDetailsField.HOA]?: number
    [PropertyDetailsField.Garage]?: number
    [PropertyDetailsField.Price]?: number
    [PropertyDetailsField.Bedrooms]?: number
    [PropertyDetailsField.Bathrooms]?: number
    [PropertyDetailsField.Sqft]?: number
    [PropertyDetailsField.lotSize]?: number
    [PropertyDetailsField.coordinate]?: GeoCoordinate
    [PropertyDetailsField.DistanceToOcean]?: number
    [PropertyDetailsField.geoPropertyInfo]?: GeoPropertyInfo
    [PropertyDetailsField.elementId]: string
}

export interface PropertyInfo extends Card, PropertyDetails {
    serializedPicture?: string
    Picture?: ReactNode
    hasCreateMapButton: boolean
    createMapButton?: (text: string, onClick: () => void) => JSX.Element
    serializedElement?: string
    element?: HTMLElement
    displayLinesArray: string[],
    labelColorHref: LabelColorHref
}