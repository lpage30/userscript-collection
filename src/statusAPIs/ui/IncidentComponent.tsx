import React, { useState} from 'react'
import { Button } from 'primereact/button'
import { Incident, IncidentUpdate } from '../statustypes'
import { toMonthDayYearDateTime } from '../../common/datetime'

interface IncidentUpdateComponentProps {
    update: IncidentUpdate
}

const IncidentUpdateComponent: React.FC<IncidentUpdateComponentProps> = ({
    update
}) => {
    return (
        <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
            <td><span>{toMonthDayYearDateTime(update.updated)}</span></td>
            <td><span><strong>{update.status}</strong></span></td>
            <td><span>{update.name}</span></td>
        </tr>
    )
}

interface IncidentComponentProps {
    title?: string
    incident: Incident
}

const IncidentComponent: React.FC<IncidentComponentProps> = ({
    title,
    incident
}) => {
    const [updates, setUpdates] = useState<IncidentUpdate[]>([])

    const toggleUpdates = () => {
        setUpdates(0 < updates.length ? [] : incident.updates)
    }

    const maxTimestamp = incident.updated > incident.timestamp ? incident.updated : incident.timestamp
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
            {title && <thead><tr style={{ alignItems: 'center', verticalAlign: 'center' }}><th colSpan={4}>{title}</th></tr></thead>}
            <tbody>
                <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                    <td><span><strong>{incident.impact}</strong></span></td>
                    <td><span><strong>{incident.status}</strong></span></td>
                    <td><span>{incident.name}</span></td>
                    <td><span>{toMonthDayYearDateTime(maxTimestamp)}</span></td>
                </tr>
                {0 < incident.updates.length && 
                    <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                        <td colSpan={4}>
                            <table style={{ 
                                tableLayout: 'auto',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                marginTop: '0',
                                marginBottom: 'auto',
                                width: '100%',    
                                }}
                            >
                                <tbody>
                                    <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                                        <td colSpan={3}>
                                            <Button className="app-button" onClick={() => toggleUpdates()}>
                                                {0 === updates.length ? 'Expand' : 'Collapse'} Updates({incident.updates.length})
                                            </Button>
                                        </td>
                                    </tr>
                                    {updates.map(update => <IncidentUpdateComponent update={update}/>)}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                }
            </tbody>
        </table>
    )
}
export default IncidentComponent