import { ReactNode } from 'react'
import { Card } from '../dashboardcomponents/datatypes'
import {
    GeoAddress,
    GeoCountryStateCityAddress,
    Place,
    GeoCoordinate,
    GeodataSourceType
} from '../geocoding/datatypes'

export const MaxPropertyInfoImageWidth = 325
export interface GeoPropertyInfo {
    propertyPlace: GeoCountryStateCityAddress
    closestOceanPlace?: Place
    displayString: string
}

export interface PropertyInfo extends Card, GeoAddress {
    source: string
    currencySymbol: string,
    oceanGeodataSource: GeodataSourceType
    isLand: boolean
    Type?: string
    Year?: number
    HOA?: number
    Garage?: number
    Price?: number
    Bedrooms?: number
    Bathrooms?: number
    Sqft?: number
    lotSize?: number
    Picture?: ReactNode
    createMapButton?: (text: string, onClick: () => void) => ReactNode
    elementId: string
    element?: HTMLElement
    coordinate?: GeoCoordinate
    DistanceToOcean?: number
    geoPropertyInfo?: GeoPropertyInfo
}