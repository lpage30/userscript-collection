import React, { CSSProperties, JSX } from 'react'
import { ServiceStatus } from '../statustypes'
import { getStatusMetadata } from '../statusService'


export function ServiceHealthStatusSpan(
    status: ServiceStatus,
    paddingLeft: number,
    paddingRight: number,
    useDivInstead: boolean = false,
    onClick?: () => void
): JSX.Element {
    const { bgColor, fgColor } = getStatusMetadata(status.status.statusLevel!)
    const style: CSSProperties = {
        backgroundColor: bgColor,
        color: fgColor,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`
    }
    return useDivInstead
        ? <div className="text-sm" style={style} onClick={onClick}>{status.serviceName}</div>
        : <span className="text-sm" style={style} onClick={onClick}>{status.serviceName}</span>
}