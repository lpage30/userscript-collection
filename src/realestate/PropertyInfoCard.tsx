import React, {JSX} from "react";
import { PropertyInfo } from "./propertyinfotypes";

interface PropertyInfoCardProps {
  id: string
  source?: string
  info: PropertyInfo
}

export const PropertyInfoCard: React.FC<PropertyInfoCardProps> = ({
  id,
  source,
  info
}) => {

  const toDisplayableInfo = (): JSX.Element[] => {
    const result: JSX.Element[] = []
    if (source) {
      result.push(<tr><td colSpan={2} style={{padding: 0, margin: 0}} className={'text-center'}>{source}</td></tr>)
    }
    if (info.Picture) {
      result.push(<tr><td colSpan={2} style={{padding: 0, margin: 0}} className={'text-center'}>{info.Picture}</td></tr>)
    }
    if (info.address) {
      result.push(<tr><td  colSpan={2} style={{padding: 0, margin: 0}} className={'text-sm text-center'}>{info.address}</td></tr>)
    }
    if (info.Type) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>Type</td><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>{info.Type}</td></tr>)    
    }
    if (info.Price) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>Price</td><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>{info.Price}</td></tr>)    
    }
    if (info.HOA) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>HOA</td><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>{info.HOA}</td></tr>)    
    }
    if (info.Year) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>Year</td><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>{info.Year}</td></tr>)    
    }
    if (info.Sqft) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>Sqft</td><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>{info.Sqft}</td></tr>)    
    }
    if (info.Bedrooms) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>Bedrooms</td><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>{info.Bedrooms}</td></tr>)    
    }
    if (info.Bathrooms) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>Bathrooms</td><td style={{padding: 0, margin: 0}} className={'text-sm text-left'}>{info.Bathrooms}</td></tr>)    
    }
    if (info.geoPropertyInfo) {
      result.push(<tr><td style={{padding: 0, margin: 0}} className={'text-sm text-left'} colSpan={2}>{info.geoPropertyInfo.displayString}</td></tr>)    
    }
    return result
  }
  return (
    <table id={id} style={{
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
