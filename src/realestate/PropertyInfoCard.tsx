import React, { JSX, CSSProperties } from "react";
import { PropertyInfo } from "./propertyinfotypes";
import { toCityStateCountryString } from "../geocoding/datatypes";

interface PropertyInfoCardProps {
  id?: string
  info: PropertyInfo
  usage?: 'dashboard' | 'controlpanel'
}

const bpHomeCard: CSSProperties = {
  borderRadius: '12px',
  boxShadow: '0 2px 6px 0 rgba(19,19,19,.12), 0 1px 2px 0 rgba(19, 19, 19, .08',
  overflow: 'hidden',
  cursor: 'pointer',
  textDecoration: 'unset',
  display: 'block',
  position: 'relative',
}
const bpHomeCardPhotoWrapper: CSSProperties = {
  overflow: 'hidden',
  position: 'relative',
  height: '0',
  backgroundColor: 'transparent',
  paddingTop: '66.67%',
}
const bpHomeCardPhoto: CSSProperties = {
  position: 'absolute',
  top: '0',
  bottom: '0',
  left: '0',
  right: '0',
  zIndex: '1',
  backgroundColor: '#4f4f4f',
}
const bpHomeCardContent: CSSProperties = {
  position: 'relative',
  padding: '.75rem 1rem 1rem 1rem',
  backgroundColor: '#fefefe',
}
const bpHomeCardPriceWrapper: CSSProperties = {
  display: 'flex',
  alignContent: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
}
const bpHomeCardPrice: CSSProperties = {
  display: 'flex',
  flexGrow: '1',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  color: '#131313',
  fontSize: '1.125rem',
  fontWeight: '700',
  lineHeight: '1.25',
}
const bpHomeCardPriceValue: CSSProperties = {
  textShadow: '0 1px 1px rgba(0,0,0,.25),0 1px 2px rgba(0,0,0,.36)',
}
const bpHomeCardStats: CSSProperties = {
  paddingTop: '.5rem',
  whiteSpace: 'nowrap',
  display: 'flex',
  flexGrow: '1',
  alignContent: 'center',
  color: '#131313',
  fontSize: '.875rem',
  fontWeight: '400',
  lineHeight: '1.5',
}
const bpHomeCardStatsData: CSSProperties = {
  paddingRight: '1rem',
  textWrap: 'nowrap'
}
const bpHomeCardAddress: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  outline: 'none',
  display: 'flex',
  alignContent: 'center',
  fontSize: '.75rem',
  fontWeight: '400',
  lineHeight: '1.25'
}

const PropertyInfoDashboardCard: React.FC<Omit<PropertyInfoCardProps, 'usage'>> = ({
  id,
  info
}) => {
  const price = info.Price
    ? `${info.currencySymbol}${info.Price.toLocaleString(undefined, { style: 'decimal', maximumFractionDigits: 0 })}`
    : '--'
  const beds = info.Bedrooms
    ? `${info.Bedrooms.toLocaleString(undefined, { style: 'decimal', maximumFractionDigits: 0 })}`
    : '--'
  const baths = info.Bathrooms
    ? `${info.Bathrooms.toLocaleString(undefined, { style: 'decimal', maximumFractionDigits: 0 })}`
    : '--'
  const sqft = info.Sqft
    ? `${info.Sqft.toLocaleString(undefined, { style: 'decimal', maximumFractionDigits: 0 })}`
    : '--'
  return (
    <div
      id={id ?? `${info.elementId}-dashboard-card`}
      style={bpHomeCard}
    >
      <div style={bpHomeCardPhotoWrapper}>
        <div style={{ ...bpHomeCardPhoto, display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
          {info.Picture}
        </div>
      </div>
      <div style={bpHomeCardContent}>
        <div style={bpHomeCardPriceWrapper}>
          <div style={bpHomeCardPrice}>
            <span style={bpHomeCardPriceValue}>{price}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={bpHomeCardPriceValue}>{info.source}</span>
          </div>
        </div>
        <div style={bpHomeCardStats}>
          <span style={bpHomeCardStatsData}>{beds} beds</span>
          <span style={bpHomeCardStatsData}>{baths} baths</span>
          <span style={bpHomeCardStatsData}>{sqft} sq ft</span>
        </div>
        <a href={info.href('')} target={'_target'} style={{textDecoration: 'none', color: 'inherit'}}>
          <span style={bpHomeCardAddress}>{info.address}</span>
          {info.geoPropertyInfo && <span style={bpHomeCardAddress}>{info.geoPropertyInfo.displayString}</span>}
        </a>
      </div>
    </div>
  )
}


const PropertyInfoDisplayCard: React.FC<Omit<PropertyInfoCardProps, 'usage'>> = ({
  id,
  info,
}) => {

  const toDisplayableInfo = (): JSX.Element[] => {
    const result: JSX.Element[] = []
    if (info.source) {
      result.push(<tr><td colSpan={2} style={{ padding: 0, margin: 0 }} className={'text-center'}>{info.source}</td></tr>)
    }
    if (info.Picture) {
      result.push(<tr><td colSpan={2} style={{ padding: 0, margin: 0 }} className={'text-center'}>{info.Picture}</td></tr>)
    }
    if (info.address) {
      result.push(<tr><td colSpan={2} style={{ padding: 0, margin: 0 }} className={'text-sm text-center'}>{info.address}</td></tr>)
    }
    if (info.Type) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>Type</td><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>{info.Type}</td></tr>)
    }
    if (info.Price) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>Price</td><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>{info.Price}</td></tr>)
    }
    if (info.HOA) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>HOA</td><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>{info.HOA}</td></tr>)
    }
    if (info.Year) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>Year</td><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>{info.Year}</td></tr>)
    }
    if (info.Sqft) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>Sqft</td><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>{info.Sqft}</td></tr>)
    }
    if (info.Bedrooms) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>Bedrooms</td><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>{info.Bedrooms}</td></tr>)
    }
    if (info.Bathrooms) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>Bathrooms</td><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'}>{info.Bathrooms}</td></tr>)
    }
    if (info.geoPropertyInfo) {
      result.push(<tr><td style={{ padding: 0, margin: 0 }} className={'text-sm text-left'} colSpan={2}>{info.geoPropertyInfo.displayString}</td></tr>)
    }
    return result
  }
  return (
    <table id={id ?? `${info.elementId}-display-card`} style={{
      tableLayout: 'auto',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: '0',
      marginBottom: 'auto',
      width: '100%',
      padding: 0,
    }}
    ><tbody>
        {toDisplayableInfo()}
      </tbody></table>
  );
}

export const PropertyInfoCard: React.FC<PropertyInfoCardProps> = ({
  id,
  info,
  usage = 'dashboard',
}) => {
  return 'dashboard' === usage
    ? <PropertyInfoDashboardCard id={id} info={info} />
    : <PropertyInfoDisplayCard id={id} info={info} />
}
