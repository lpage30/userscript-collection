import React, { ReactNode } from 'react'
import { Button } from 'primereact/button'
import { toHashCode } from '../common/functions'
import {
    GeoAddress,
} from '../geocoding/datatypes'
import {
    toCityStateCountryString,
} from '../geocoding/countrystatecitytypes'
import {
    PlaceDistance,
    GeocodedCountryStateCityAddress,
    toGeocodedCountryStateCityAddress

} from '../geocoding/geocodedcountrystatecitytypes'
import { classifyGeoCountryStateCity } from '../geocoding/countryStateCityGeoAddressClassifiers'
import { findClosestGeodataPlace } from '../geocoding/findClosestPlace'
import { PropertyInfo } from './propertyinfotypes'
import { PropertyInfoCard } from './PropertyInfoCard'
import { reactToHTMLElement } from '../common/ui/renderRenderable'
import { toDurationString } from '../common/datetime'
import { cacheGeoPropertyInfo, getCachedGeoPropertyInfo } from './propertyinfocache'

export function toCreateButtonFunction(): (text: string, onClick: () => void) => ReactNode {
    return (text: string, onClick: () => void): ReactNode => (
        <Button
            title={text}
            className={`app-button`}
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 0,
                margin: 0,
            }}
        >
            <div
                title={text}
                className={'map'}
            />
            <span
                className={'text-center'}
            >{text}</span>
        </Button>

    )
}
export function toPropertyInfoCard(data: Partial<PropertyInfo>): PropertyInfo {
    const result: Partial<PropertyInfo> = {
        ...data
    }
    result.hasCreateMapButton = undefined !== result.createMapButton
    result.displayLinesArray = [
        `${result.currencySymbol}${result.Price.toLocaleString('en-US')}@${result.address}`,
        `${result.Bedrooms} Beds, ${result.Bathrooms} baths`,
        `${result.Sqft} sqft`,
    ].filter(t => undefined !== t)
    // InfoDisplay
    result.displayLines = () => result.displayLinesArray

    // PicklistItem
    const href = data.href('')
    result.groupName = result.address
    result.labelColorHref = { label: result.address, color: 'white', href }
    result.label = () => result.labelColorHref.label
    result.color = () => result.labelColorHref.color
    result.href = () => result.labelColorHref.href
    result.elementId = toHashCode(href)
    return result as PropertyInfo
}

export async function geocodePropertyInfoCard(data: PropertyInfo, reportProgress?: (progress: string) => void): Promise<PropertyInfo> {
    if (data.geoPropertyInfo) return data
    const tstart = Date.now()
    const propertyPlace: GeocodedCountryStateCityAddress = await toGeocodedCountryStateCityAddress(await classifyGeoCountryStateCity(data as GeoAddress))
    const closestOceanPlace: PlaceDistance | undefined = await findClosestGeodataPlace(data.oceanGeodataSource, propertyPlace)
    const oceanDistance = closestOceanPlace
        ? `${closestOceanPlace.distance.value.toLocaleString(undefined, {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} miles to Ocean`
        : undefined
    const displayString = closestOceanPlace?.place?.region
        ? `${oceanDistance} at ${toCityStateCountryString(closestOceanPlace.place.region)}`
        : oceanDistance
    const geoPropertyInfo = {
        propertyPlace,
        closestOceanPlace,
        displayString,
    }
    reportProgress(`Geocoded ${data.source} ${data.elementId}. ${toDurationString(Date.now() - tstart)}`)
    const DistanceToOcean = geoPropertyInfo.closestOceanPlace ? geoPropertyInfo.closestOceanPlace.distance.value : undefined
    const displayLinesArray = [...data.displayLinesArray, geoPropertyInfo.displayString]

    let result: PropertyInfo = {
        ...data,
        displayLinesArray,
        displayLines: () => displayLinesArray,
        geoPropertyInfo,
        DistanceToOcean,

    }
    const renderable: HTMLElement = reactToHTMLElement(data.elementId, <PropertyInfoCard
        info={result} usage={'dashboard'} />
    )
    return {
        ...result,
        renderable
    }
}
