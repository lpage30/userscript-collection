
import React from 'react'
import { ServiceStatus } from '../statustypes'
import { StatusLevel, getStatusMetadata } from '../statusService'
import { ServiceHealthStatusSpan } from './IndicatorStatusComponents'
import { MultirowArrayItem } from '../../common/ui/multirow_element'

export const serviceStatusToMultirowElement = (serviceStatus: ServiceStatus): MultirowArrayItem => ({
    id: serviceStatus.elementId,
    getElement: (isFirst: boolean, isLast: boolean, onClick?: () => void) => (<>
        {!isFirst && <span className="text-sm">&nbsp;&#x2022;&nbsp;</span>}
        {ServiceHealthStatusSpan(
            serviceStatus,
            !isFirst ? 5 : 3,
            !isLast ? 5 : 3,
            false,
            onClick
        )}
    </>)
})

export const statusLevelToMultrowElement = (statusLevel: StatusLevel): MultirowArrayItem => ({
    id: statusLevel.toString(),
    getElement: (isFirst: boolean, isLast: boolean, onClick?: () => void) => (
        <span className="text-sm" style={{
            backgroundColor: getStatusMetadata(statusLevel).bgColor,
            color: getStatusMetadata(statusLevel).fgColor,
            paddingLeft: `5px`,
            paddingRight: `5px`
        }} onClick={onClick}>{getStatusMetadata(statusLevel).statusName}</span>
    )
})