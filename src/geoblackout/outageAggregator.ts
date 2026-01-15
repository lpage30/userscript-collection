// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab
// https://geoblackout.com/us/report/internet/
// https://geoblackout.com/us/report/internet/*
import { OutageBreakdown } from './outageBreakdownAPItypes'

export async function aggregateOutages(): Promise<OutageBreakdown[]> {
    const pendingListingHrefs = awaitOutageListing()
    const tab = GM_openInTab(`https://geoblackout.com/us/report/internet`, { active: false })
    const listingHrefs = await pendingListingHrefs
    if (tab && !tab.closed) {
        tab.close()
    }
    return Promise.all(listingHrefs.map(loadOutage))
}

const GMListingVariable = 'geoblackout-internet-listing'
const GMServiceOutageVariable = (name: string) => `geoblackout-${name}-outage`


export function reportOutageListing(hrefListing: string[]) {
    GM_setValue(GMListingVariable, JSON.stringify({
        timestamp: Date.now(),
        hrefListing
    }))
}

export function reportServiceOutage(outage: OutageBreakdown) {
    GM_setValue(GMServiceOutageVariable(outage.service), JSON.stringify({
        timestamp: Date.now(),
        outage
    }))
}

async function awaitOutageListing(): Promise<string[]> {
    return new Promise<string[]>(resolve => {
        const listenerId = GM_addValueChangeListener(
            GMListingVariable,
            (name: string, oldValue: any, newValue: any, remote: boolean) => {
                GM_removeValueChangeListener(listenerId ?? "");
                const timestampListing = JSON.parse(newValue)
                resolve(timestampListing.hrefListing)
            }
        )
    })
}
async function awaitServiceOutage(service: string): Promise<OutageBreakdown> {
    return new Promise<OutageBreakdown>(resolve => {
        const listenerId = GM_addValueChangeListener(
            GMServiceOutageVariable(service),
            (name: string, oldValue: any, newValue: any, remote: boolean) => {
                GM_removeValueChangeListener(listenerId ?? "");
                const timestampOutage = JSON.parse(newValue)
                resolve(timestampOutage.outage)
            }
        )
    })

}

async function loadOutage(listingHref: string): Promise<OutageBreakdown> {
    const url = new URL(listingHref)
    const service = url.pathname.split('/').slice(-1)[0]
    const pendingOutage = awaitServiceOutage(service)
    const tab = GM_openInTab(listingHref, { active: false })
    const outage: OutageBreakdown = await pendingOutage
    if (tab && !tab.closed) {
        tab.close()
    }
    return outage
}
