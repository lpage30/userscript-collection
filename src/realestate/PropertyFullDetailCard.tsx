import React, { JSX, useState, useRef, useEffect } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { LabelValueTable } from '../common/ui/LabelValueTable'
import { GeoPropertyInfo, PropertyDetails, PropertyDetailsFields } from './propertyinfotypes'
import { GeocodedCity, GeocodedCountry, GeocodedCountryStateCityAddress, GeocodedState, PlaceDistance } from '../geocoding/geocodedcountrystatecitytypes'
import { GeoCoordinate, toGeoCoordinateString, toGoogleMapsPlace } from '../geocoding/datatypes'
import { splitByCapitals, wordsToTitleCase } from '../common/functions'

const countryStateCityToJSXElement = (name: string, data: GeocodedCity | GeocodedState | GeocodedCountry): JSX.Element => {
    if (data) {
        const coordinates = toGeoCoordinateString(data as GeoCoordinate)
        const datasourceDetails = Object.keys(data.geocoding).map(datasource => (
            <details>
                <summary>{`${datasource}`}: {`${data.geocoding[datasource].geojsonIndexes.length}`} indexes, {`${data.geocoding[datasource].distantGeojsonIndexes.length}`} distantIndexes</summary>
                {0 < data.geocoding[datasource].geojsonIndexes.length && (
                    <details><summary>FirstIndex: data.geocoding[datasource].geojsonIndexes[0]</summary>
                        <ul>{data.geocoding[datasource].geojsonIndexes.map(index => <li>{`${index}`}</li>)}</ul>
                    </details>
                )}
                {0 < data.geocoding[datasource].distantGeojsonIndexes.length && (
                    <details><summary>First Distant Index: data.geocoding[datasource].distantGeojsonIndexes[0]</summary>
                        <ul>{data.geocoding[datasource].distantGeojsonIndexes.map(index => <li>{`${index}`}</li>)}</ul>
                    </details>
                )}
            </details>
        ))
        return <details><summary><a href={toGoogleMapsPlace(data as GeoCoordinate)} target={'_blank'}>{`${data.name} ${coordinates}`}</a></summary>{datasourceDetails}</details>
    }
    return <>{`${name} Not Found`}</>
}

interface PlaceDistanceCardProps {
    id: string
    info: PlaceDistance
}
const PlaceDistanceCard: React.FC<PlaceDistanceCardProps> = ({
    id,
    info
}) => {
    if ([undefined, null].includes(info)) return <>Not Found</>

    const countryStateCity: [string, JSX.Element][] = info.place.region
        ? [
            ['City', countryStateCityToJSXElement('City', info.place.region.city)],
            ['State', countryStateCityToJSXElement('State', info.place.region.state)],
            ['Country', countryStateCityToJSXElement('Country', info.place.region.country)]
        ] : []

    const placeDetails: [string, JSX.Element][] = [
        ['Coordinate', <a href={toGoogleMapsPlace(info.place.coordinate)} target={'_blank'}>{toGeoCoordinateString(info.place.coordinate)}</a>],
        ['Region', info.place.region
            ? <LabelValueTable id={`${id}-place-region`} labelValueArray={countryStateCity} border={true} />
            : <>Not Found</>
        ]
    ]
    const details: [string, JSX.Element][] = [
        ['Place', <LabelValueTable id={`${id}-place`} labelValueArray={placeDetails} border={true} />],
        ['Distance', <>{`${info.distance.value} ${info.distance.units}`}</>]
    ]
    return <LabelValueTable id={id} labelValueArray={details} border={true} />
}


interface GeocodedCountryStateCityAddressCardProps {
    id: string
    info: GeocodedCountryStateCityAddress
}
const GeocodedCountryStateCityAddressCard: React.FC<GeocodedCountryStateCityAddressCardProps> = ({
    id,
    info
}) => {
    if ([undefined, null].includes(info)) return <>Not Found</>

    const details: [string, JSX.Element][] = [
        ['Address', <>{info.address ?? 'address not disclosed'}</>],
        ['Coordinates', <a href={toGoogleMapsPlace(info.coordinate)} target={'_blank'}>{toGeoCoordinateString(info.coordinate)}</a>],
        ['City', countryStateCityToJSXElement('City', info.city)],
        ['State', countryStateCityToJSXElement('State', info.state)],
        ['Country', countryStateCityToJSXElement('Country', info.country)],
    ]
    return <LabelValueTable id={id} labelValueArray={details} border={true} />
}

interface GeoPropertyInfoCardProps {
    id: string
    info: GeoPropertyInfo
}
const GeoPropertyInfoCard: React.FC<GeoPropertyInfoCardProps> = ({
    id,
    info
}) => {
    if ([undefined, null].includes(info)) return <>Not Found</>

    const details: [string, JSX.Element][] = [
        ['Property Place', <GeocodedCountryStateCityAddressCard id={`${id}-property-place`} info={info.propertyPlace} />],
        ['Closest Ocean Place', <PlaceDistanceCard id={`${id}-closest-ocean-place`} info={info.closestOceanPlace} />],
        ['Display String', <>{info.displayString}</>]
    ]
    return <LabelValueTable id={id} labelValueArray={details} border={true} />

}


interface PropertyFullDetailTableProps {
    id: string
    property: PropertyDetails
}
const PropertyFullDetailTable: React.FC<PropertyFullDetailTableProps> = ({
    id,
    property,
}) => {
    const details: [string, JSX.Element][] = Object.values(PropertyDetailsFields).map(fieldName => {
        const label: string = wordsToTitleCase(splitByCapitals(fieldName), () => false).join(' ')
        const value: JSX.Element = fieldName === 'coordinate'
            ? <a href={toGoogleMapsPlace(property[fieldName])} target={'_blank'}>{toGeoCoordinateString(property[fieldName])}</a>
            : fieldName === 'geoPropertyInfo'
                ? <GeoPropertyInfoCard id={`${id}-geoproperty-info`} info={property[fieldName]} />
                : <>{`${property[fieldName]}`}</>
        return [label, value]
    })
    return <LabelValueTable id={id} labelValueArray={details} />
}


interface PropertyFullDetailCardPopupProps {
    property: PropertyDetails
}
interface PropertyFullDetailCardPopupState {
    visible: boolean
}
export const PropertyFullDetailCardPopup: React.FC<PropertyFullDetailCardPopupProps> = ({
    property
}) => {
    const [state, setState] = useState<PropertyFullDetailCardPopupState>({ visible: false })
    const id = `${property.elementId}-property-details`
    const toggleDetailCard = (level) => {
        console.log(`ToggleDetail! ${level}`)
        setState({ ...state, visible: !state.visible })
    }
    return <>
        <Button
            id={`${id}-button`}
            className={'app-button'}
            onClick={() => toggleDetailCard('click')}
            onMouseDown={() => toggleDetailCard('mouse')}
            onPointerDown={() => toggleDetailCard('pointer')}
        >{state.visible ? 'Close' : 'Open'} Property Details</Button>
        <Dialog
            id={id}
            appendTo={'self'}
            header={<h2>Property Details</h2>}
            showHeader={true}
            visible={state.visible}
            position={'top-left'}
            onHide={() => toggleDetailCard('DIALOG')}
            modal={false}
            draggable={true}
            resizable={true}
            maximizable={true}
            closable={true}
            showCloseIcon={true}
            style={{ position: 'absolute' }}
        >
            <PropertyFullDetailTable id={`${id}-card`} property={property} />
        </Dialog>

    </>
}
