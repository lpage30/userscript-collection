import { ReactNode } from 'react'
import { Card } from '../dashboardcomponents/datatypes'
import {
    GeoAddress,
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
    element?: HTMLElement
    coordinate?: GeoCoordinate
    DistanceToOcean?: number
    geoPropertyInfo?: GeoPropertyInfo
    elementId: string
    hasCreateMapButton: boolean
    serializedElement?: string
    serializedPicture?: string
    displayLinesArray: string[],
    labelColorHref: LabelColorHref

}