import React, { useState, JSX } from 'react'
import { Button } from 'primereact/button'
import { ServiceStatus, Incident } from '../statustypes'
import StatusComponent from './StatusComponent'
import IncidentComponent from './IncidentComponent'
import { getStatusMetadata } from '../statusService'
import { companyHealthStatusToMultirowElement } from '../../common/ui/CompanyHealthStatusComponents'
import { CompanyHealthStatus, sortAndTablifyCompanyHealthStatuses } from '../../common/CompanyHealthStatus'

interface ServiceStatusComponentProps {
    serviceStatus: ServiceStatus
    companyHealthStatuses?: CompanyHealthStatus[]
}

export const ServiceStatusComponent: React.FC<ServiceStatusComponentProps> = ({
    serviceStatus,
    companyHealthStatuses
}) => {
    const companyStatuses = sortAndTablifyCompanyHealthStatuses((companyHealthStatuses ?? [])
        .filter(({ dependentServiceStatuses }) => (dependentServiceStatuses ?? [])
            .some(({ serviceName }) => serviceName === serviceStatus.serviceName)),
        6)
    const [incidents, setIncidents] = useState<Incident[]>([])
    const toggleIncidents = () => {
        setIncidents(0 < incidents.length ? [] : serviceStatus.incidents
            .sort((l: Incident, r: Incident) => {
                const order1 = (r.statusLevel) - (l.statusLevel ?? 0)
                return 0 !== order1 ? order1 : l.name.localeCompare(r.name)
            }))
    }

    return (<div style={{
        width: '100%',
        margin: '0 auto',
        borderLeft: `5px solid ${getStatusMetadata(serviceStatus.status.statusLevel!).bgColor}`
    }}>
        <div>
            <div style={{ display: 'flex', padding: '10px', alignItems: 'center' }}>
                <h3 style={{ paddingRight: '10px' }}><a href={serviceStatus.statusPage}>{serviceStatus.serviceName}</a></h3>
                <StatusComponent status={serviceStatus.status} />
                <Button
                    className="app-button"
                    style={{ border: '2px solid #007bff', borderRadius: '5px' }}
                    onClick={() => toggleIncidents()}
                >
                    {0 === incidents.length ? 'Expand' : 'Collapse'} Incidents({serviceStatus.incidents.length})
                </Button>
            </div>
            {
                companyStatuses.map((row, index) => (<>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: 0 < index ? '5px' : undefined }}>
                        {row.map((status, index) => (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {companyHealthStatusToMultirowElement(status).getElement(0 === index, row.length <= (index + 1))}
                            </div>
                        ))}
                    </div>
                </>))
            }
        </div>
        {0 < incidents.length &&
            incidents.map(incident => (
                <div style={{ marginLeft: '20px' }}>
                    <IncidentComponent incident={incident} />
                </div>
            ))
        }
    </div>)
}