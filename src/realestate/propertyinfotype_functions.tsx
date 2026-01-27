import React, { JSX } from 'react'
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
import { deserializeImgToImgData } from './serialize_deserialize_functions'
import { geocodeAddress } from '../geocoding/geocoding_api/geocode_address'
import { classifyGeoCountryStateCity } from '../geocoding/countryStateCityGeoAddressClassifiers'
import { findClosestGeodataPlace } from '../geocoding/findClosestPlace'
import { PropertyInfo } from './propertyinfotypes'
import { toDurationString } from '../common/datetime'

export function toCreateButtonFunction(): (text: string, onClick: () => void) => JSX.Element {
    return (text: string, onClick: () => void): JSX.Element => (
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
        result.isLand ? 'Land' : 'Property',
        `${result.currencySymbol}${result.Price.toLocaleString('en-US')}`,
        ...(result.isLand
            ? [`${result.lotSize ?? result.Sqft ?? '--'} sqft lot`]
            : [`${result.Bedrooms} Beds, ${result.Bathrooms} baths`, `${result.Sqft} sqft`]),
        `${result.address}`,
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
    if (undefined === data.coordinate) {
        const imgData = deserializeImgToImgData(data.serializedPicture)
        const geoAddress = await geocodeAddress(data.address, imgData ? [imgData.src] : [])
        if (geoAddress && geoAddress.coordinate) {
            data.coordinate = geoAddress.coordinate
            data.coordinateOrigin = geoAddress.coordinateOrigin
        }
    } else {
        data.coordinateOrigin = 'Listing'
    }
    data.displayLinesArray = [...data.displayLinesArray, `CoordinateSource: ${data.coordinateOrigin}`]
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

    return {
        ...data,
        displayLinesArray,
        displayLines: () => displayLinesArray,
        geoPropertyInfo,
        DistanceToOcean,
    }
}
