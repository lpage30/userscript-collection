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
}
export interface Incident {
    timestamp: number
    impact: ImpactType
    name: string
    status: StatusType
    updated: number
    updates: IncidentUpdate[]
}

export interface ServiceStatus {
    statusPage: string
    serviceName: string
    status: Status | null
    incidents: Incident[] | null
}

export interface ServiceAPI {
    serviceStatus: ServiceStatus[]
    load(): Promise<ServiceStatus[]>
}
