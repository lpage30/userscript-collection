import { OutageBreakdown } from "../geoblackout/outageBreakdownAPItypes"
import { ServiceStatus } from "../statusAPIs/statustypes"

export const HealthLevelTypes = ['danger', 'warning', 'success'] as const;
export type HealthLevelType = (typeof HealthLevelTypes)[number];

export interface CompanyHealthStatus {
    companyName: string,
    level: HealthLevelType;
    dependentServiceStatuses: ServiceStatus[]
    outageBreakdownService?: OutageBreakdown
}

export const CompanyHealthLevelTypeInfoMap = {
    danger: { rank: 1, bgColor: 'red', fgColor: 'white', displayName: 'Major Impact' },
    warning: { rank: 2, bgColor: 'orange', fgColor: 'black', displayName: 'Minor Impact' },
    success: { rank: 3, bgColor: 'green', fgColor: 'white', displayName: 'No Impact' }
}

export function sortAndTablifyCompanyHealthStatuses(statuses: CompanyHealthStatus[], columnsPerRow: number): CompanyHealthStatus[][] {
    return Object.keys(CompanyHealthLevelTypeInfoMap)
        .sort((l: string, r: string) => CompanyHealthLevelTypeInfoMap[l].rank - CompanyHealthLevelTypeInfoMap[r].rank)
        .reduce((result, healthStatus) => ([
            ...result,
            ...statuses
                .filter(({ level }) => healthStatus === level.toLowerCase().trim())
                .sort((l: CompanyHealthStatus, r: CompanyHealthStatus) => l.companyName.localeCompare(r.companyName))
        ]), [] as CompanyHealthStatus[])
        .reduce((rows, status, index) => {
            const result = [...rows]
            if (0 === (index % columnsPerRow)) {
                result.push([])
            }
            result[result.length - 1].push(status)
            return result
        }, [])
}