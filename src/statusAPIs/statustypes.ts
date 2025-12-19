import { CountryStateCity, classifyCountryStateCity, compareFunction as compareLocation } from './countryCityService'
import { StatusLevel, classifyStatus, compareFunction as compareStatusLevel, determineOverallStatusLevel} from './statusService'
export type IndicatorType = 'major' | 'minor' | string
export type ImpactType = 'critical' | 'minor' | 'none' | string
export type StatusType = 'major_outage' | 'partial_outage' | 'identified' | 'scheduled' | 'in_progress' | string
export interface Status {
    timestamp: number
    description: string
    indicator: IndicatorType
    statusLevel?: StatusLevel
}
export interface IncidentUpdate {
    name: string
    status: StatusType
    updated: number
    location?: CountryStateCity
    statusLevel?: StatusLevel
}
export interface Incident {
    timestamp: number
    impact: ImpactType
    name: string
    status: StatusType
    updated: number
    updates: IncidentUpdate[]
    location?: CountryStateCity
    statusLevel?: StatusLevel    
}

export interface ServiceStatus {
    statusPage: string
    dependentCompanies: string[]
    serviceName: string
    status: Status
    incidents: Incident[]
}

export interface ServiceAPI {
    isLoading: boolean
    serviceStatus: ServiceStatus[]
    registerOnIsLoadingChange: (onChange: (isLoading: boolean) => void) => void
    load(force: boolean): Promise<ServiceStatus[]>
}

export interface CompanyHealthStatus {
    companyName: string,
    healthStatus: 'danger' | 'warning' | 'success'
}

export function classifyServiceStatus(status: ServiceStatus): ServiceStatus {
    const incidents: Incident[] = status.incidents.map(incident => ({
        ...incident,
        updates: incident.updates.map(update => ({
            ...update,
            location: classifyCountryStateCity(update.name),
            statusLevel: classifyStatus(`${update.status} ${update.name}`),
        })),
        location: classifyCountryStateCity(incident.name),
        statusLevel: classifyStatus(`${incident.status} ${incident.name}`),
    }))
    return {
        ...status,
        status: {
            ...status.status,
            statusLevel: determineOverallStatusLevel(status.status, incidents)
        },
        incidents
    }
}
export function sortServiceIncidents(status: ServiceStatus): ServiceStatus {
    let incidents: Incident[] = status.incidents.map(incident => ({
        ...incident,
        updates: incident.updates.sort((l: IncidentUpdate, r: IncidentUpdate) => {
            const statusCmpValue = compareStatusLevel(
                {text: l.name, status: l.statusLevel},
                {text: r.name, status: r.statusLevel}, 
                false,
            )
            if (0 === statusCmpValue) {
                return compareLocation(
                    {text: l.name, location: l.location},
                    {text: r.name, location: r.location},
                    true,
                )
            }
            return statusCmpValue
        })
    }))
    incidents = incidents.sort((l: Incident, r: Incident) => {
        const statusCmpValue = compareStatusLevel(
            {text: l.name, status: l.statusLevel},
            {text: r.name, status: r.statusLevel}, 
            false,
        )
        if (0 === statusCmpValue) {
            return compareLocation(
                {text: l.name, location: l.location},
                {text: r.name, location: r.location},
                true,
            )
        }
        return statusCmpValue
    })
    return {
        ...status,
        incidents: incidents
    }
}