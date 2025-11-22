import React, { useState} from 'react'
import { Button } from 'primereact/button'
import { ServiceStatus, Incident } from '../statustypes'
import StatusComponent from './StatusComponent'
import IncidentComponent from './IncidentComponent'

interface ServiceStatusComponentComponentProps {
    serviceStatus: ServiceStatus
}

const ServiceStatusComponent: React.FC<ServiceStatusComponentComponentProps> = ({
    serviceStatus
}) => {
    const [incidents, setIncidents] = useState<Incident[]>([])
    const toggleIncidents = () => {
        setIncidents(0 < incidents.length ? [] : serviceStatus.incidents)
    }

    return (<div style={{ width: '100%', margin: '0 auto'}}>
        <div style={{display: 'flex', padding: '10px', alignItems: 'center'}}>
            <h3 style={{paddingRight: '10px'}}><a href={serviceStatus.statusPage}>{serviceStatus.serviceName}</a></h3>
            <StatusComponent status={serviceStatus.status}/>
            <Button
                className="app-button"
                style={{border: '2px solid #007bff', borderRadius: '5px'}} 
                onClick={() => toggleIncidents()}
            >
                {0 === incidents.length ? 'Expand' : 'Collapse'} Incidents({serviceStatus.incidents.length})
            </Button>
        </div>
        {0 < incidents.length &&
            incidents.map(incident => (
                <div style={{marginLeft: '20px'}}>
                    <IncidentComponent incident={incident}/>
                </div>
            ))
        }
    </div>)
}

export default ServiceStatusComponent
