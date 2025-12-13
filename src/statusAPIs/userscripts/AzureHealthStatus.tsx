// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://azure.status.microsoft/en-us/status
import React from "react";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitQueryAll
} from "../../common/await_functions";
import { storeAzureStatus, AzureHealthStatusPage } from "../services/azure";
import { ScrapedServiceStatusRegionsMap, toPersistableStatus } from "./scrapedStatusTypes";

async function scrapeServiceStatusRegions(): Promise<ScrapedServiceStatusRegionsMap> {
  type ScrapedServiceStatusTable = {
    columnHeaders: string[],
    dataRows: string[][]
  }
  return Array.from(await awaitQueryAll('table'))
    .map(e => ({ header: e.children[0], body: e.children[1] }))
    .filter(({ header, body }) => header !== undefined && body !== undefined && header.tagName === 'THEAD' && body.tagName === 'TBODY' && header.children[0] !== undefined)
    .map(({ header, body }) => {
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
    }).reduce((serviceStatusRegionsMap, { columnHeaders, dataRows }) => {
      // extract and aggregate service + region info from all table definitions
      return dataRows.reduce((result, serviceRegionRow) => {
        const serviceName = serviceRegionRow[0]
        const status = serviceRegionRow[1]
        const regions = serviceRegionRow.slice(2).map((regionStatus, index) => ({ region: columnHeaders[2 + index], status: regionStatus }))
        if (result[serviceName] === undefined) {
          result[serviceName] = { status: [], regions: [] }
        }
        result[serviceName].status.push(status)
        result[serviceName].regions.push(...regions)
        return result
      }, serviceStatusRegionsMap)
    }, {} as ScrapedServiceStatusRegionsMap)
}




export const AzureHealthStatus: Userscript = {
  name: "AzureHealthStatus",
  containerId: 'azure-health-status',

  isSupported: (href: string): boolean =>
    href.startsWith(AzureHealthStatusPage),
  preparePage: (href: string): Promise<void> => awaitPageLoadByEvent(),
  createContainer: async (href: string): Promise<HTMLElement> => {
    return null
  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const scrapedServiceStatusRegions = await scrapeServiceStatusRegions()
    storeAzureStatus(toPersistableStatus(scrapedServiceStatusRegions))
  },
}