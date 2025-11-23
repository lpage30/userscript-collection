// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
import React from "react";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitQuerySelection
} from "../common/await_functions";
import { PersistableStatus } from "./persistence";
import { Status, Incident, IncidentUpdate} from "./statustypes";
import { GCPZonePageUrlMap, storeGCPStatus, NoStatusStatus, getMaxOccurringValidStatus } from "./gcp";

const gcpUrls = Object.values(GCPZonePageUrlMap)
const getZone = (href: string): string => {
    const found = Object.entries(GCPZonePageUrlMap).find(([_zone, url]) => url === href)
    return found[0]
}

type ScrapedServiceStatusRegionsMap = {
  [service:string]: {
    status: string[],
    regions: {
      status: string,
      region: string
    }[]
  }
}
async function scrapeServiceStatusRegions(): Promise<ScrapedServiceStatusRegionsMap> {
    const [header, body] = Array.from((await awaitQuerySelection('psd-regional-table')).querySelector('table').children)
    const columnHeaders = Array.from(header.firstElementChild.children).map(e => (e as HTMLElement).innerText)
    const dataRows = Array.from(body.children)
        .map(tr => Array.from(tr.children)
            .map((td, index) => 0 == index 
                ? (td as HTMLElement).innerText.trim()
                : td.querySelector('svg')?.ariaLabel ?? 'none'
            )
        )
    return dataRows.reduce((result, dataRow) => {
        const serviceName = dataRow[0]
        const status = dataRow.slice(1)
        const regions = columnHeaders.slice(1)
        return {
            ...result,
            [serviceName]: {
                status,
                regions: regions.map((region, index) => ({
                    status: status[index],
                    region
                }))
            }
        }
    }, {} as ScrapedServiceStatusRegionsMap)

}
function toPersistableStatus(serviceStatusRegionsMap: ScrapedServiceStatusRegionsMap): PersistableStatus {
  const timestamp = Date.now()
  const statuses: string[] = []
  const incidents = Object.entries(serviceStatusRegionsMap).map(([serviceName, statusRegions]) => {
    const updates = statusRegions.regions.map(({region, status}) => ({
      name: region,
      status,
      updated: timestamp
    } as IncidentUpdate))
    let globalStatus = getMaxOccurringValidStatus(statusRegions.status)
    if (globalStatus === NoStatusStatus) {
      globalStatus = getMaxOccurringValidStatus(updates.map(({status}) => status))
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
export const GCPHealthStatusPages = 'https://status.cloud.google.com/'
export const GCPHealthStatus: Userscript = {
  name: "GCPHealthStatus",

  isSupported: (href: string): boolean => gcpUrls.includes(href),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByEvent();
    const zone = getZone(href)
    const scrapedServiceStatusRegions = await scrapeServiceStatusRegions()
    storeGCPStatus(zone, toPersistableStatus(scrapedServiceStatusRegions))
  }
}

