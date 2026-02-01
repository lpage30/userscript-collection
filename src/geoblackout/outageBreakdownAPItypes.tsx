import React, { JSX } from 'react'
import { normalizeName } from '../common/functions'
import { Card } from '../dashboardcomponents/datatypes'
export const OutageBreakdownGraphDimensions = {
    width: 677,
    height: 250
}
export interface OutageBreakdownData {
    percentage: number
    type: string
    alertCount: number
}
export interface ReferenceTimelineLineData {
    label: 'Reference'
    data: { x: string, y: number }[]
    borderColor: string,
    borderDash: number[]
    borderWidth: number
    fill: boolean
    pointHoverRadius: number
    pointRadius: number
    tension: number
}
export interface ReportedTimelineGraphData {
    label: 'Reports'
    type: string
    data: { x: string, y: number }[]
    backgroundColor: string[]
    borderColor: string[],
    borderWidth: number
}
export type ReportedTimelineGraph = (ReferenceTimelineLineData | ReportedTimelineGraphData)[]

export interface OutageBreakdown extends Card {
    timestamp: number
    serviceHref: string
    service: string
    graphData: ReportedTimelineGraph
    blurb: string
    data: OutageBreakdownData[]
}
export function toOutageBreakdownCard(breakdown: OutageBreakdown): Card {
    return {
        ...breakdown,
        groupName: breakdown.service,
        label: () => `${breakdown.service}`,
        color: () => 'grey',
        href: () => breakdown.serviceHref,
        elementId: breakdown.service,
        displayLines: () => [
            breakdown.service,
            ...breakdownDataToString(breakdown.data),
        ]
    } as Card
}
export function breakdownDataToString(data: OutageBreakdownData[]): string[] {
    return data.map(d => `${d.type}: ${d.percentage}% (${d.alertCount})`)
}
export function breakdownDataToElement(data: OutageBreakdownData): JSX.Element {
    return <><b>{data.type}</b> {`${data.percentage}`}%</>
}

function normalizeCompanyNameForService(companyName: string): string {
    return normalizeName(companyName).replace(/_/g, '').trim().toLowerCase()
}
export interface CompanyOutageBreakdownMap {
    [companyName: string]: OutageBreakdown
}
export function mapCompanyToOutageBreakdown(
    companyNames: string[],
    services: OutageBreakdown[]
): CompanyOutageBreakdownMap {

    const companies: { name: string, normalizedName: string }[] = companyNames
        .map(name => ({
            name,
            normalizedName: normalizeCompanyNameForService(name)
        }))
    return services.reduce((
        companyServiceMap: CompanyOutageBreakdownMap,
        service: OutageBreakdown
    ) => {
        const found = companies.find(value => value.normalizedName.includes(service.service))
        if (found) {
            return {
                ...companyServiceMap,
                [found.name]: service
            }
        }
        return companyServiceMap
    }, {} as CompanyOutageBreakdownMap)
}

export interface OutageAPI {
    isLoading: boolean
    outageBreakdown: OutageBreakdown[]
    registerOnIsLoadingChange: (onChange: (isLoading: boolean) => void) => void
    load(force: boolean): Promise<OutageBreakdown[]>
}