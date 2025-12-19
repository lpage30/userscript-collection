import React, { CSSProperties, JSX } from 'react'
import { ServiceStatus } from '../statustypes'
import {
    CompanyHealthLevelTypeInfoMap
} from './IndicatorStatusTypeInfoMaps'
import { getStatusMetadata } from '../statusService'


export function ServiceHealthStatusSpan(
    status: ServiceStatus,
    paddingLeft: number,
    paddingRight: number,
    useDivInstead: boolean = false
): JSX.Element {
    const { bgColor, fgColor } = getStatusMetadata(status.status.statusLevel!)
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