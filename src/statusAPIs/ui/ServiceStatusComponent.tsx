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
            <thead>
                <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                    <th className="text-center">{serviceStatus.serviceName}</th>
                </tr>
            </thead>
            <tbody>
                <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                    <td><StatusComponent status={serviceStatus.status}/></td>
                </tr>
                <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                    <td>
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
                                    <td>
                                        <Button className="app-button" onClick={() => toggleIncidents()}>
                                            {0 === incidents.length ? 'Expand' : 'Collapse'} Incidents({serviceStatus.incidents.length})
                                        </Button>
                                    </td>
                                </tr>
                                {0 < incidents.length &&
                                    incidents.map(incident => (
                                        <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                                            <td>
                                                <IncidentComponent incident={incident}/>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>                        
                    </td>
                </tr>
            </tbody>
        </table>
    )
}

export default ServiceStatusComponent
