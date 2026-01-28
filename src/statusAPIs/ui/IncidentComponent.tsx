import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { Incident, IncidentUpdate } from '../statustypes'
import { getStatusMetadata, classifyStatus } from '../statusService'
import { toMonthDayYearDateTime } from '../../common/datetime'

interface IncidentUpdateComponentProps {
    update: IncidentUpdate
}

const IncidentUpdateComponent: React.FC<IncidentUpdateComponentProps> = ({
    update
}) => {
    const statusMetadata = getStatusMetadata(update.statusLevel ?? classifyStatus(update.status))
    return (
        <div style={{ display: 'flex', padding: '10px', alignItems: 'center' }}>
            <span style={{ paddingRight: '10px' }}>{toMonthDayYearDateTime(update.updated)}</span>
            <span style={{ paddingRight: '10px' }}><strong>{statusMetadata ? statusMetadata.statusName : update.status}</strong></span>
            <span style={{ paddingRight: '10px' }}>{update.name}</span>
        </div>
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
        setUpdates(0 < updates.length ? [] : incident.updates
            .sort((l: IncidentUpdate, r: IncidentUpdate) => {
                const order1 = (r.statusLevel ?? 0) - (l.statusLevel ?? 0)
                return 0 !== order1 ? order1 : l.name.localeCompare(r.name)
            })
        )
    }

    const maxTimestamp = incident.updated > incident.timestamp ? incident.updated : incident.timestamp
    const statusMetadata = getStatusMetadata(incident.statusLevel ?? classifyStatus(incident.status))
    const impactMetadata = getStatusMetadata(incident.statusLevel ?? classifyStatus(incident.impact)) ?? statusMetadata

    return (
        <>
            <div style={{ display: 'flex', padding: '10px', alignItems: 'center' }}>
                {title && <span style={{ paddingRight: '10px' }}><strong>{title}</strong></span>}
                <span style={{ paddingRight: '10px' }}><strong>{impactMetadata ? impactMetadata.impactName : incident.impact}</strong></span>
                <span style={{ paddingRight: '10px' }}><strong>{statusMetadata ? statusMetadata.statusName : incident.status}</strong></span>
                <span style={{ paddingRight: '10px' }}>{incident.name}</span>
                <span style={{ paddingRight: '10px' }}>{toMonthDayYearDateTime(maxTimestamp)}</span>
                <Button
                    className="app-button"
                    style={{ border: '2px solid #007bff', borderRadius: '5px' }}
                    onClick={() => toggleUpdates()}
                >
                    {0 === updates.length ? 'Expand' : 'Collapse'} Updates({incident.updates.length})
                </Button>
            </div>
            {updates.map(update => (
                <div style={{ marginLeft: '20px' }}>
                    <IncidentUpdateComponent update={update} />
                </div>
            ))}
        </>
    )
}
export default IncidentComponent