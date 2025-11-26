import { PersistableStatus } from "../persistence"
import { getMaxOccurringValidStatus, NoStatusStatus } from "../conversionfunctions"
import { Incident, IncidentUpdate, Status } from "../statustypes"
export type ScrapedServiceStatusRegionsMap = {
  [service: string]: {
    status: string[],
    regions: {
      status: string,
      region: string
    }[]
  }
}

export function toPersistableStatus(serviceStatusRegionsMap: ScrapedServiceStatusRegionsMap): PersistableStatus {
  const timestamp = Date.now()
  const statuses: string[] = []
  const incidents = Object.entries(serviceStatusRegionsMap).map(([serviceName, statusRegions]) => {
    const updates = statusRegions.regions.map(({ region, status }) => ({
      name: region,
      status,
      updated: timestamp
    } as IncidentUpdate))
    let globalStatus = getMaxOccurringValidStatus(statusRegions.status)
    if (globalStatus === NoStatusStatus) {
      globalStatus = getMaxOccurringValidStatus(updates.map(({ status }) => status))
    }
    statuses.push(globalStatus)
    return {
      timestamp,
      impact: [NoStatusStatus].includes(globalStatus) ? 'none' : globalStatus,
      name: serviceName,
      status: globalStatus,
      updated: timestamp,
      updates
    } as Incident
  })
  const overallStatus = getMaxOccurringValidStatus(statuses)
  return {
    status: {
      timestamp,
      description: overallStatus,
      indicator: overallStatus
    } as Status,
    incidents
  }
}