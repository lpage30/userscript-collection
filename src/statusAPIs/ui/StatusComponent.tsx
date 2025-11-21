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
    return (
        <table style={{ 
            tableLayout: 'auto',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '0',
            marginBottom: 'auto',
            width: '100%',    
            }}
        >
            {title && <thead><tr style={{ alignItems: 'center', verticalAlign: 'center' }}><th colSpan={3}>{title}</th></tr></thead>}
            <tbody>
                <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                    <td><span><strong>{status.indicator}</strong></span></td>
                    <td><span>{status.description}</span></td>
                    <td><span>{toMonthDayYearDateTime(status.timestamp)}</span></td>
                </tr>
            </tbody>
        </table>
    )
}
export default StatusComponent