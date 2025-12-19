import { CountryStateCity, classifyCountryStateCity, compareFunction as compareLocation } from './countryCityService'
import { StatusLevel, classifyStatus, compareFunction as compareStatusLevel} from './statusService'
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
            statusLevel: classifyStatus(update.name),
        })),
        location: classifyCountryStateCity(incident.name),
        statusLevel: classifyStatus(incident.name),
    }))
    const statusLevel = Object.entries(
        incidents.reduce((levelCounts, incident) => {
            const result = incident.updates.reduce((updateLevelCounts, update) => {
                if (undefined !== update.statusLevel) {
                    if (undefined === updateLevelCounts[update.statusLevel]) {
                        updateLevelCounts[update.statusLevel] = 0
                    }
                    updateLevelCounts[update.statusLevel] = updateLevelCounts[update.statusLevel] + 1
                }
                return updateLevelCounts
            }, {...levelCounts})
            if (undefined !== incident.statusLevel) {
                if (undefined === result[incident.statusLevel]) {
                    result[incident.statusLevel] = 0
                }
                result[incident.statusLevel] = result[incident.statusLevel] + 1
            }
            return result
        }, {} as { [level: number]: number })
    ).reduce((maxEntry, entry) => {
        if (maxEntry[1] < entry[1]) {
            return entry
        }
        return maxEntry
    }, [-1, 0])[0] as number
    
    return {
        ...status,
        status: {
            ...status.status,
            statusLevel: 0 <= statusLevel ? statusLevel as StatusLevel : classifyStatus(status.status.indicator) ?? StatusLevel.Operational
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