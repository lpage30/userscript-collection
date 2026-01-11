import React from 'react'
import { toHashCode } from '../common/functions'
import {
    GeoAddress,
    GeoCountryStateCityAddress,
    Place,
    toGeoPlace,
    toGeoCountryStateCityAddressString,
    toCityStateCountryString,
    toPlaceString,
} from '../geocoding/datatypes'
import { classifyGeoCountryStateCity } from '../geocoding/countryStateCityGeoAddressClassifiers'
import { findClosestGeodataPlace } from '../geocoding/findClosestPlace'
import { PropertyInfo } from './propertyinfotypes'
import { PropertyInfoCard } from './PropertyInfoCard'
import { reactToHTMLElement } from '../common/ui/renderRenderable'

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
    return result as PropertyInfo
}

export async function geocodePropertyInfoCard(data: PropertyInfo): Promise<PropertyInfo> {
    if (data.geoPropertyInfo) return data
    const propertyPlace: GeoCountryStateCityAddress = await classifyGeoCountryStateCity(data as GeoAddress)
    const closestOceanPlace: Place | undefined = await findClosestGeodataPlace(data.oceanGeodataSource, toGeoPlace(propertyPlace))
    const DistanceToOcean = closestOceanPlace ? Math.round(closestOceanPlace.distance.value) : undefined

    const oceanDistance = DistanceToOcean
    ? `${DistanceToOcean.toLocaleString(undefined, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} miles to Ocean`
    : undefined

    const displayString = closestOceanPlace?.place?.region
    ? `${oceanDistance} at ${toCityStateCountryString(closestOceanPlace.place.region)}`
    : oceanDistance

    let result: PropertyInfo = {
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
        DistanceToOcean,

    }
    const renderable: HTMLElement = reactToHTMLElement(data.elementId, <PropertyInfoCard 
        info={result} usage={'dashboard'}/>
    )
    return {
        ...result,
        renderable
    }
}

