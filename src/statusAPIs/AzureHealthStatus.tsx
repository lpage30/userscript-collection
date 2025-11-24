// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
import React from "react";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitQueryAll
} from "../common/await_functions";
import { PersistableStatus } from "./persistence";
import { Status, Incident, IncidentUpdate} from "./statustypes";
import { storeAzureStatus } from "./azure";
import { getMaxOccurringValidStatus, NoStatusStatus} from "./conversionfunctions";

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
  type ScrapedServiceStatusTable = {
    columnHeaders: string[],
    dataRows: string[][]
  }
  return Array.from(await awaitQueryAll('table'))
    .map(e => ({ header: e.children[0], body: e.children[1]}))
    .filter(({header, body}) => header !== undefined && body !== undefined && header.tagName === 'THEAD' && body.tagName === 'TBODY' && header.children[0] !== undefined)
    .map(({header, body}) => {
      // scrape out the table definitions (headers + table data rows)
      const columnHeaders = Array.from(header.children[0].children).map(th => (th as HTMLElement).innerText.replace('\n', '').trim());
      const dataRows = Array.from(body.children)
        .filter(tr => tr.childElementCount === columnHeaders.length)
        .map(tr => Array.from(tr.children)
          .map(td => (td as HTMLElement).innerText.replace('\n', '').trim())
      ); 
      return { 
          columnHeaders,
          dataRows
      } as ScrapedServiceStatusTable;
    }).reduce((serviceStatusRegionsMap, {columnHeaders, dataRows}) => {
        // extract and aggregate service + region info from all table definitions
        return dataRows.reduce((result, serviceRegionRow) => {
          const serviceName = serviceRegionRow[0]
          const status = serviceRegionRow[1]
          const regions = serviceRegionRow.slice(2).map((regionStatus, index) => ({ region: columnHeaders[2 + index], status: regionStatus}))
          if(result[serviceName] === undefined) {
            result[serviceName] = { status: [], regions: [] }
          }
          result[serviceName].status.push(status)
          result[serviceName].regions.push(...regions)
          return result
      }, serviceStatusRegionsMap)
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


export const AzureHealthStatusPage = 'https://azure.status.microsoft/en-us/status'
export const AzureHealthStatus: Userscript = {
  name: "AzureHealthStatus",

  isSupported: (href: string): boolean =>
    href.startsWith(AzureHealthStatusPage),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByEvent();
    const scrapedServiceStatusRegions = await scrapeServiceStatusRegions()
    storeAzureStatus(toPersistableStatus(scrapedServiceStatusRegions))
  }
}