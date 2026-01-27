import { JSX, ReactNode } from 'react'
import { Card } from '../dashboardcomponents/datatypes'
import {
    GeodataSourceType
} from '../geocoding/datatypes'
import {
    PlaceDistance,
    GeocodedCountryStateCityAddress
} from '../geocoding/geocodedcountrystatecitytypes'
import { GeocodeAddressOrigin } from '../geocoding/geocoding_api/geocode_address'

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
export const PropertyDetailsFields = [
    'source',
    'isLand',
    'Type',
    'address',
    'city',
    'state',
    'country',
    'coordinate',
    'coordinateOrigin',
    'Price',
    'currencySymbol',
    'Year',
    'HOA',
    'Garage',
    'Bedrooms',
    'Bathrooms',
    'Sqft',
    'lotSize',
    'oceanGeodataSource',
    'DistanceToOcean',
    'geoPropertyInfo',
    'elementId',
]

export interface PropertyDetails extends GeocodeAddressOrigin {
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
    DistanceToOcean?: number
    geoPropertyInfo?: GeoPropertyInfo
    elementId: string
}
export const toGeocodeAddressOrigin = (property: PropertyDetails): GeocodeAddressOrigin => property as GeocodeAddressOrigin

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