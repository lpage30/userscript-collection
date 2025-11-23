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
import { Status, Incident, IncidentUpdate} from "./statustypes";
import { storeAzureStatus } from "./azure";

const getMaxOccuringStatus = (statuses: string[]) => {
  const statusOccurrence = statuses.reduce((statusOccurrenceMap, status) => {
      statusOccurrenceMap[status] = statusOccurrenceMap[status] ?? 0 + 1
      return statusOccurrenceMap
  }, {} as { [status: string]: number})
  return Object.entries(statusOccurrence).reduce((NameMax, [name, count]) => {
    return count > NameMax.max ? { name, max: count} : NameMax
  }, { name: '', max: 0}).name
}

async function scrapeServicesStatus(): Promise<{ status: Status, incidents: Incident[]}> {
  const timestamp = Date.now()
  const serviceRegionStatusTableArray: { columnHeaders: string[], dataRows: string[][] }[] = Array.from(await awaitQueryAll('table'))
    .map(e => ({ header: e.children[0], body: e.children[1]}))
    .filter(({header, body}) => header !== undefined && body !== undefined && header.tagName === 'THEAD' && body.tagName === 'TBODY' && header.children[0] !== undefined)
    .map(({header, body}) => {
      const columnHeaders = Array.from(header.children[0].children).map(th => (th as HTMLElement).innerText.replace('\n', '').trim());
      const dataRows = Array.from(body.children)
        .filter(tr => tr.childElementCount === columnHeaders.length)
        .map(tr => Array.from(tr.children)
          .map(td => (td as HTMLElement).innerText.replace('\n', '').trim())
      ); 
      return { 
          columnHeaders,
          dataRows
      };
    })
  const serviceStatusRegionsMapArray: { [serviceName: string]: { status: string[], regions: { region: string, status: string}[] } }[] =
    serviceRegionStatusTableArray.map(({columnHeaders, dataRows}) => {
        return dataRows.reduce((serviceStatusIncidentMap, serviceRegionRow) => {
        const serviceName = serviceRegionRow[0]
        const status = serviceRegionRow[1]
        const regions = serviceRegionRow.slice(2).map((regionStatus, index) => ({ region: columnHeaders[2 + index], status: regionStatus}))
        if(serviceStatusIncidentMap[serviceName] === undefined) {
          serviceStatusIncidentMap[serviceName] = { status: [], incidents: [] }
        }
        serviceStatusIncidentMap[serviceName].status.push(status)
        serviceStatusIncidentMap[serviceName].regions.push(...regions)
        return serviceStatusIncidentMap
      }, {})
  })

  const serviceStatusRegionsMap = serviceStatusRegionsMapArray.reduce((serviceMap, serviceRegionMap) => {
    return Object.entries(serviceRegionMap).reduce((result, [serviceName, region]) => {
      if (result[serviceName] === undefined) {
        result[serviceName] = { status: [], regions: []}
      }
      result[serviceName].status.push(...region.status)
      result[serviceName].regions.push(...region.regions)
      return result
    }, serviceMap)

  }, {} as { [serviceName: string]: { status: string[], regions: { region: string, status: string}[] } })
  const statuses: string[] = []
  const incidents = Object.entries(serviceStatusRegionsMap).map(([serviceName, statusRegions]) => {
    const updates = statusRegions.regions.map(({region, status}) => ({
      name: region,
      status,
      updated: timestamp
    } as IncidentUpdate))
    const serviceStatuses = [...statusRegions.status, ...updates.map(({status}) => status)]
    const globalStatus = getMaxOccuringStatus(serviceStatuses)
    statuses.push(...serviceStatuses)
    return {
      timestamp,
      impact: globalStatus,
      name: serviceName,
      status: globalStatus,
      updated: timestamp,
      updates
    } as Incident
  })

  return {
    status: {
      timestamp,
      description: getMaxOccuringStatus(statuses),
      indicator: getMaxOccuringStatus(statuses)
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
    storeAzureStatus(await scrapeServicesStatus())
  }
}