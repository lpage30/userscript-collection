import React from 'react'
import { Status } from '../statustypes'
import { toMonthDayYearDateTime } from '../../common/datetime'

interface StatusComponentProps {
    title?: string
    status: Status
}

const StatusComponent: React.FC<StatusComponentProps> = ({
    title,
    status
}) => {
    return (<div style={{display: 'flex', padding: '10px'}}>
        {title && <span style={{paddingRight: '10px'}}><strong>{title}</strong></span>}
        <span style={{paddingRight: '10px'}}><strong>{status.indicator}</strong></span>
        <span style={{paddingRight: '10px'}}>{status.description}</span>
        <span>{toMonthDayYearDateTime(status.timestamp)}</span>
    </div>)
}
export default StatusComponent