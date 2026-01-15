import { normalizeName } from '../common/functions'

export interface OutageBreakdownData {
    percentage: number
    type: string
    alertCount: number
}
export interface OutageBreakdown {
    timestamp: number
    service: string
    data: OutageBreakdownData[]
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