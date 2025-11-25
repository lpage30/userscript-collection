import React, { CSSProperties, JSX } from 'react'
import { ServiceStatus } from '../statustypes'
import {
    IndicatorTypeInfoMap,
    toIndicatorTypeInfo,
    CompanyHealthLevelTypeInfoMap
} from './IndicatorStatusTypeInfoMaps'


export function ServiceHealthStatusSpan(
    status: ServiceStatus,
    paddingLeft: number,
    paddingRight: number,
    useDivInstead: boolean = false
): JSX.Element {
    const { bgColor, fgColor } = IndicatorTypeInfoMap[toIndicatorTypeInfo(status.status.indicator)]
    const style: CSSProperties = {
        backgroundColor: bgColor,
        color: fgColor,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`
    }
    return useDivInstead
        ? <div className="text-sm" style={style}>{status.serviceName}</div>
        : <span className="text-sm" style={style}>{status.serviceName}</span>
}

export function CompanyHealthStatusSpan(
    companyName: string,
    status: 'danger' | 'warning' | 'success',
    paddingLeft: number,
    paddingRight: number,
    useDivInstead: boolean = false
): JSX.Element {
    const { bgColor, fgColor } = CompanyHealthLevelTypeInfoMap[status]
    const style: CSSProperties = {
        backgroundColor: bgColor,
        color: fgColor,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`
    }
    return useDivInstead
        ? <div style={style}>{companyName}</div>
        : <span style={style}>{companyName}</span>
}