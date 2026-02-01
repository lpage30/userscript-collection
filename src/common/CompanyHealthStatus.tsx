import React, { JSX } from 'react'
import { OutageBreakdown } from "../geoblackout/outageBreakdownAPItypes"
import { ServiceStatus } from "../statusAPIs/statustypes"

export const HealthLevelTypes = ['danger', 'warning', 'success'] as const;
export type HealthLevelType = (typeof HealthLevelTypes)[number];
export const CompanyGraphSvgDimensions = {
  width: 242.492,
  height: 40
}
export interface CompanyHealthStatus {
    companyName: string,
    level: HealthLevelType;
    riskFactor: number
    graphSvgSparkline: (scaling?: { width: number, height: number }) => JSX.Element
    dependentServiceStatuses: ServiceStatus[]
    outageBreakdownService?: OutageBreakdown
}
export function toCompanyHealthStatus<T extends CompanyHealthStatus>(c: T): CompanyHealthStatus {
    return c as CompanyHealthStatus
}

export const CompanyHealthLevelTypeInfoMap = {
    danger: { rank: 1, bgColor: 'red', fgColor: 'white', displayName: 'Major Impact' },
    warning: { rank: 2, bgColor: 'orange', fgColor: 'black', displayName: 'Minor Impact' },
    success: { rank: 3, bgColor: 'green', fgColor: 'white', displayName: 'No Impact' }
}
export function CompanyHealthStatusSort(l: CompanyHealthStatus, r: CompanyHealthStatus) {
    const order1 = CompanyHealthLevelTypeInfoMap[l.level].rank - CompanyHealthLevelTypeInfoMap[r.level].rank
    const order2 = r.riskFactor - l.riskFactor
    return 0 !== order1 ? order1 : (0 !== order2 ? order2 : l.companyName.localeCompare(r.companyName))
}

export function sortAndTablifyCompanyHealthStatuses(statuses: CompanyHealthStatus[], columnsPerRow: number): CompanyHealthStatus[][] {
    return statuses.sort(CompanyHealthStatusSort)
        .reduce((rows, status, index) => {
            const result = [...rows]
            if (0 === (index % columnsPerRow)) {
                result.push([])
            }
            result[result.length - 1].push(status)
            return result
        }, [])
}

export function toCompanyTitleText(company: CompanyHealthStatus, prefix?: String, suffix?: string): string {
    return `${prefix ?? ''} ${company.companyName} (RiskFactor: ${company.riskFactor}) ${suffix ?? ''}`.trim()
}
