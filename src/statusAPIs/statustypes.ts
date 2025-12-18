import { CountryStateCity, classifyCountryStateCity, compareFunction } from './countryCityService'
export type IndicatorType = 'major' | 'minor' | string
export type ImpactType = 'critical' | 'minor' | 'none' | string
export type StatusType = 'major_outage' | 'partial_outage' | 'identified' | 'scheduled' | 'in_progress' | string
export interface Status {
    timestamp: number
    description: string
    indicator: IndicatorType
}
export interface IncidentUpdate {
    name: string
    status: StatusType
    updated: number
    location?: CountryStateCity
}
export interface Incident {
    timestamp: number
    impact: ImpactType
    name: string
    status: StatusType
    updated: number
    updates: IncidentUpdate[]
    location?: CountryStateCity
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

export function classifyServiceStatusLocations(status: ServiceStatus): ServiceStatus {
    const incidents: Incident[] = status.incidents.map(incident => ({
        ...incident,
        updates: incident.updates.map(update => ({
            ...update,
            location: classifyCountryStateCity(update.name)
        })),
        location: classifyCountryStateCity(incident.name)
    }))
    return {
        ...status,
        incidents
    }
}
export function sortServiceIncidents(status: ServiceStatus): ServiceStatus {
    let incidents: Incident[] = status.incidents.map(incident => ({
        ...incident,
        updates: incident.updates.sort((l: IncidentUpdate, r: IncidentUpdate) => compareFunction(
            {text: l.name, location: l.location},
            {text: r.name, location: r.location}
        ))
    }))
    incidents = incidents.sort((l: Incident, r: Incident) => compareFunction(
        {text: l.name, location: l.location},
        {text: r.name, location: r.location}
    ))
    return {
        ...status,
        incidents: incidents
    }
}