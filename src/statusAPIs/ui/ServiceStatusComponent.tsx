import React, { CSSProperties, useState, JSX} from 'react'
import { Button } from 'primereact/button'
import { ServiceStatus, Incident, CompanyHealthStatus } from '../statustypes'
import StatusComponent from './StatusComponent'
import IncidentComponent from './IncidentComponent'

interface ServiceStatusComponentComponentProps {
    serviceStatus: ServiceStatus
    companyHealthStatuses?: CompanyHealthStatus[]
}
export const statusRankColorMap = {
    danger: { rank: 1, bgColor: 'red', fgColor: 'white', displayName: 'Major Impact'},
    warning:{ rank: 2, bgColor: 'orange', fgColor: 'black', displayName: 'Minor Impact'},
    success:{ rank: 3, bgColor: 'green', fgColor: 'white', displayName: 'No Impact'}
}
function sortAndTablifyCompanyHealthStatuses(statuses: CompanyHealthStatus[], columnsPerRow: number): CompanyHealthStatus[][] {
    return Object.keys(statusRankColorMap)
        .sort((l: string, r: string) => statusRankColorMap[l].rank - statusRankColorMap[r].rank)
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


function companyHealthStatusSpan(
    companyName: string,
    status: 'danger' | 'warning' | 'success',
    paddingLeft: number,
    paddingRight: number
): JSX.Element {
    return <span style={{
            backgroundColor: statusRankColorMap[status].bgColor,
            color: statusRankColorMap[status].fgColor,
            paddingLeft: `${paddingLeft}px`,
            paddingRight: `${paddingRight}px`
        }}>{companyName}</span>
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

    return (<div style={{ width: '100%', margin: '0 auto'}}>
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
                                {companyHealthStatusSpan(
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
