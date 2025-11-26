// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://www.fastlystatus.com/
import React from "react";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitQuerySelection
} from "../../common/await_functions";
import { storeFastlyStatus, FastlyHealthStatusPage } from "../services/fastly";
import { ScrapedServiceStatusRegionsMap, toPersistableStatus } from "./scrapedStatusTypes";

async function scrapeServiceStatusRegions(): Promise<ScrapedServiceStatusRegionsMap> {
    const table = await awaitQuerySelection('table[class*="historygrid"]')
    return Array.from(table.querySelector('tbody').children).reduce((result, td) => { 
        const serviceName = (td.children[0] as HTMLElement).innerText
            .split('\n')
            .map(t => t.trim())
            .filter(t => 0 < t.length)[0]
        const status = Array.from(td.children[2].children[0].classList)
            .filter(t => t.startsWith('component-'))[0].split('-')[1].trim()
        return {
            ...result,
            [serviceName]: {
                status: [status],
                regions: []
            }
        }
    }, {} as ScrapedServiceStatusRegionsMap)
}

export const FastlyHealthStatus: Userscript = {
  name: "FastlyHealthStatus",

  isSupported: (href: string): boolean =>
    href.startsWith(FastlyHealthStatusPage),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByEvent();
    const scrapedServiceStatusRegions = await scrapeServiceStatusRegions()
    storeFastlyStatus(toPersistableStatus(scrapedServiceStatusRegions))
  }
}