// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://status.digitalocean.com/
import React from "react";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitQuerySelection
} from "../../common/await_functions";
import { storeDigitalOceanStatus, DigitalOceanStatusPage } from "../services/digitalocean";
import { ScrapedServiceStatusRegionsMap, toPersistableStatus } from "./scrapedStatusTypes";

async function scrapeServiceStatusRegions(): Promise<ScrapedServiceStatusRegionsMap> {
  const globalStatuses: ScrapedServiceStatusRegionsMap = Array.from((await awaitQuerySelection('div[class*="three-columns"]')).children)
    .reduce((result, div) => {
      const serviceName = (div.querySelector('span[class*="name"]') as HTMLElement).innerText.trim()
      const status = (div.querySelector('span[class*="component-status"]') as HTMLElement).innerText.trim()
      return {
        ...result,
        [serviceName]: {
          status: [status],
          regions: []
        }
      }
    }, {} as ScrapedServiceStatusRegionsMap)

  const serviceStatuses: ScrapedServiceStatusRegionsMap = Array.from((await awaitQuerySelection('div[class*="regional"]')).querySelector('div[class*="three-columns"]').children)
    .reduce((result, div) => {
      const serviceName = (div.children[0] as HTMLElement).innerText.trim()
      const status = (div.children[0] as HTMLElement).dataset.componentStatus
      const regions = Array.from(div.children[1].children).map(regionDiv => ({
        region: (regionDiv as HTMLElement).innerText.split('\n').map(item => item.trim()).filter(item => 0 < item.length)[0],
        status: (regionDiv as HTMLElement).dataset.componentStatus
      }))
      if (result[serviceName] === undefined) {
        result[serviceName] = {
          status: [],
          regions: []
        }
      }
      result[serviceName].status.push(status)
      result[serviceName].regions.push(...regions)
      return result
    }, globalStatuses)
  return serviceStatuses
}


export const DigitalOceanHealthStatus: Userscript = {
  name: "DigitalOceanHealthStatus",

  isSupported: (href: string): boolean =>
    href.startsWith(DigitalOceanStatusPage),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByEvent();
    const scrapedServiceStatusRegions = await scrapeServiceStatusRegions()
    storeDigitalOceanStatus(toPersistableStatus(scrapedServiceStatusRegions))
  }
}