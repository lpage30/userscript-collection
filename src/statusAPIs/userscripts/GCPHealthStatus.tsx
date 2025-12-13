// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://status.cloud.google.com/index.html
// @include     https://status.cloud.google.com/regional/americas
// @include     https://status.cloud.google.com/regional/europe
// @include     https://status.cloud.google.com/regional/asia
// @include     https://status.cloud.google.com/regional/middle-east
// @include     https://status.cloud.google.com/regional/africa
// @include     https://status.cloud.google.com/regional/multiregions

import React from "react";
import { Userscript } from "../../common/userscript";
import {
    awaitPageLoadByEvent,
    awaitQuerySelection
} from "../../common/await_functions";
import { GCPZonePageUrlMap, storeGCPStatus } from "../services/gcp";
import { ScrapedServiceStatusRegionsMap, toPersistableStatus } from "./scrapedStatusTypes";

const gcpUrls = Object.values(GCPZonePageUrlMap)
const getZone = (href: string): string => {
    const found = Object.entries(GCPZonePageUrlMap).find(([_zone, url]) => url === href)
    return found[0]
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

export const GCPHealthStatus: Userscript = {
    name: "GCPHealthStatus",
    containerId: 'gcp-health-status',
    isSupported: (href: string): boolean => gcpUrls.includes(href),
    preparePage: (href: string): Promise<void> => awaitPageLoadByEvent(),
    createContainer: async (href: string): Promise<HTMLElement> => {
        return null
    },
    renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
        const zone = getZone(href)
        const scrapedServiceStatusRegions = await scrapeServiceStatusRegions()
        storeGCPStatus(zone, toPersistableStatus(scrapedServiceStatusRegions))
    },
}

