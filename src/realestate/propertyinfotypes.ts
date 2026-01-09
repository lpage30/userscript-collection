import { ReactNode } from 'react'
import { Card } from '../dashboardcomponents/datatypes'
import { toHashCode } from '../common/functions'
import {
    GeoAddress,
    GeoCountryStateCityAddress,
    Place,
    toGeoPlace,
    toGeoCountryStateCityAddressString,
    toPlaceString,
    GeoCoordinate,
    GeodataSourceType
} from '../geocoding/datatypes'
import { classifyGeoCountryStateCity } from '../geocoding/countryStateCityGeoAddressClassifiers'
import { findClosestGeodataPlace } from '../geocoding/findClosestPlace'

export const MaxPropertyInfoImageWidth = 325
export interface GeoPropertyInfo {
    propertyPlace: GeoCountryStateCityAddress
    closestOceanPlace?: Place
    displayString: string
}

export interface PropertyInfo extends Card, GeoAddress {
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
}

export function toPropertyInfoCard(data: Partial<PropertyInfo>): PropertyInfo {
    const result: Partial<PropertyInfo> = {
        ...data
    }
    // InfoDisplay
    result.displayLines = () => [
        `${result.Price}@${result.address}`,
        `${result.Bedrooms} Beds, ${result.Bathrooms} baths`,
        `${result.Sqft} sqft`,
    ].filter(t => undefined !== t)

    // PicklistItem
    const href = data.href('')
    result.groupName = result.address
    result.label = () => result.address
    result.color = () => 'white'
    result.href = () => href
    result.elementId = toHashCode(href)
    // Card
    result.renderable = result.element
    return result as PropertyInfo
}

export async function geocodePropertyInfoCard(data: PropertyInfo): Promise<PropertyInfo> {
    if (data.geoPropertyInfo) return data

    const propertyPlace: GeoCountryStateCityAddress = classifyGeoCountryStateCity(data as GeoAddress)
    const closestOceanPlace: Place | undefined = await findClosestGeodataPlace(data.oceanGeodataSource, toGeoPlace(propertyPlace))
    const displayString = `Ocean Location: ${closestOceanPlace ? toPlaceString(closestOceanPlace) : toGeoCountryStateCityAddressString(propertyPlace)}`

    return {
        ...data,
        displayLines: () => ([
            ...data.displayLines(),
            displayString
        ]),
        geoPropertyInfo: {
            propertyPlace,
            closestOceanPlace,
            displayString,
        },
        DistanceToOcean: closestOceanPlace ? Math.round(closestOceanPlace.distance.value) : undefined,
    }
}

