import { StatusLevel, getStatusMetadata, classifyStatus, compareFunction as compareStatusLevel, determineOverallStatusLevel } from './statusService'
import { Card } from '../dashboardcomponents/datatypes'
import { toHashCode } from '../common/functions'

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
    statusLevel?: StatusLevel
}
export interface Incident {
    timestamp: number
    impact: ImpactType
    name: string
    status: StatusType
    updated: number
    updates: IncidentUpdate[]
    statusLevel?: StatusLevel
}

export interface ServiceStatus extends Card {
    statusPage: string
    dependentCompanies: string[]
    serviceName: string
    status: Status
    incidents: Incident[]
}
export function toServiceStatusCard(status: ServiceStatus): Card {
    return {
        ...status,
        groupName: status.statusPage,
        label: () => `${status.serviceName} ${status.status.description}`,
        color: () => getStatusMetadata(status.status.statusLevel).bgColor,
        href: () => '',
        elementId: toHashCode(status.serviceName),
        displayLines: () => [
            status.serviceName,
            `IndicatorType: ${status.status.indicator}`,
            `StatusLevel: ${status.status.statusLevel}`
        ]
    } as Card
}
export const isServiceStatusForAnyCompanies = (status: ServiceStatus, companyNames: string[]) => {
    return companyNames.some(companyName => companyName.includes(status.serviceName)) ||
        status.dependentCompanies.some(name => companyNames.some(companyName => companyName.includes(name)))
}
export const isServiceStatusForCompany = (status: ServiceStatus, companyName: string) => isServiceStatusForAnyCompanies(status, [companyName])

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

export async function classifyServiceStatus(status: ServiceStatus): Promise<ServiceStatus> {
    const incidents: Incident[] = []
    for (const incident of status.incidents) {
        const updates: IncidentUpdate[] = []
        for (const update of incident.updates) {
            updates.push({
                ...update,
                statusLevel: classifyStatus(`${update.status} ${update.name}`),
            })
        }
        incidents.push({
            ...incident,
            updates,
            statusLevel: classifyStatus(`${incident.status} ${incident.name}`),
        })
    }
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
                { text: l.name, status: l.statusLevel },
                { text: r.name, status: r.statusLevel },
                false,
            )
            return statusCmpValue
        })
    }))
    incidents = incidents.sort((l: Incident, r: Incident) => {
        const statusCmpValue = compareStatusLevel(
            { text: l.name, status: l.statusLevel },
            { text: r.name, status: r.statusLevel },
            false,
        )
        return statusCmpValue
    })
    return {
        ...status,
        incidents: incidents
    }
}