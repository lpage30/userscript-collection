// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://status.cloud.microsoft/m365
import React from "react";
import { Userscript } from "../../common/userscript";
import {
    awaitPageLoadByEvent,
    awaitElementById,
    awaitQuerySelection
} from "../../common/await_functions";
import { storeM365Status, M365HealthStatusPage } from "../services/microsoft365";
import { ScrapedServiceStatusRegionsMap, toPersistableStatus } from "./scrapedStatusTypes";

async function scrapeServiceStatusRegions(): Promise<ScrapedServiceStatusRegionsMap> {
    const topElement = await awaitElementById('consumerCard')
    const overallServiceStatus = (topElement
        .querySelector('div[class*="cardFlexHeaderContainer"]') as HTMLElement)
        .innerText.split('\n').map(t => t.trim()).filter(t => 1 < t.length)
    const showProductsButton = topElement.querySelector('button')
    showProductsButton.click()
    await awaitQuerySelection('ul')
    const serviceStatuses = Array.from(topElement.querySelectorAll('li'))
        .map((li: HTMLElement) => {
            const serviceStatus = li.innerText.split('\n').map(t => t.trim()).filter(t => 1 < t.length)
            return serviceStatus
        })
    return [
        overallServiceStatus,
        ...serviceStatuses
    ].reduce((result, [serviceName, status]) => ({
        ...result,
        [serviceName]: {
            status: [status],
            regions: []
        }
    }), {} as ScrapedServiceStatusRegionsMap)
}


export const Microsoft365HealthStatus: Userscript = {
    name: "M365HealthStatus",
    containerId: 'm365-health-status',
    isSupported: (href: string): boolean =>
        href.startsWith(M365HealthStatusPage),
    preparePage: (href: string): Promise<void> => awaitPageLoadByEvent(),
    createContainer: async (href: string): Promise<HTMLElement> => {
        return null
    },
    renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
        const scrapedServiceStatusRegions = await scrapeServiceStatusRegions()
        storeM365Status(toPersistableStatus(scrapedServiceStatusRegions))
    },
}