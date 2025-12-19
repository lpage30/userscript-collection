import React, { useState, JSX} from 'react'
import { Button } from 'primereact/button'
import { ServiceStatus, Incident, CompanyHealthStatus } from '../statustypes'
import StatusComponent from './StatusComponent'
import IncidentComponent from './IncidentComponent'
import { CompanyHealthLevelTypeInfoMap } from './IndicatorStatusTypeInfoMaps'
import { getStatusMetadata } from '../statusService'
import { CompanyHealthStatusSpan } from './IndicatorStatusComponents'

interface ServiceStatusComponentComponentProps {
    serviceStatus: ServiceStatus
    companyHealthStatuses?: CompanyHealthStatus[]
}

function sortAndTablifyCompanyHealthStatuses(statuses: CompanyHealthStatus[], columnsPerRow: number): CompanyHealthStatus[][] {
    return Object.keys(CompanyHealthLevelTypeInfoMap)
        .sort((l: string, r: string) => CompanyHealthLevelTypeInfoMap[l].rank - CompanyHealthLevelTypeInfoMap[r].rank)
        .reduce((result, level) => ([
            ...result,
            ...statuses
                .filter(({healthStatus}) => level === healthStatus.toLowerCase().trim())
                .sort((l: CompanyHealthStatus, r: CompanyHealthStatus) => l.companyName.localeCompare(r.companyName))
        ]), [] as CompanyHealthStatus[])
        .reduce((rows, status, index) => {
            const result = [...rows]
            if (0 === (index % columnsPerRow)){
                result.push([])
            }
            result[result.length - 1].push(status)
            return result
        }, [])
}

const ServiceStatusComponent: React.FC<ServiceStatusComponentComponentProps> = ({
    serviceStatus,
    companyHealthStatuses
}) => {
    const companyStatuses = sortAndTablifyCompanyHealthStatuses((companyHealthStatuses ?? [])
        .filter(({companyName}) => 
            companyName.includes(serviceStatus.serviceName) || 
            serviceStatus.dependentCompanies.some(name => companyName.includes(name))
        ), 10)
    const [incidents, setIncidents] = useState<Incident[]>([])
    const toggleIncidents = () => {
        setIncidents(0 < incidents.length ? [] : serviceStatus.incidents)
    }

    return (<div style={{ 
        width: '100%', 
        margin: '0 auto',
        borderLeft: `5px solid ${getStatusMetadata(serviceStatus.status.statusLevel!).bgColor}`
    }}>
        <div>
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
            {
                companyStatuses.map((row, index) => (<>
                    <div style={{display: 'flex', alignItems: 'center', paddingTop: 0 < index ? '5px' : undefined}}>
                        {row.map((status, index) => (
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                {0 < index && <span>&nbsp;&#x2022;&nbsp;</span>}
                                {CompanyHealthStatusSpan(
                                    status.companyName,
                                    status.healthStatus,
                                    0 < index ? 5 : 3,
                                    (index + 1) < row.length ? 5 : 3
                                )}
                            </div>
                        ))}
                    </div>
                </>))
            }
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
