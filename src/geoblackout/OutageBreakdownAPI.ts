import { OutageBreakdown, OutageAPI, toOutageBreakdownCard } from './outageBreakdownAPItypes'
import { aggregateOutages } from './outageAggregator'
import { Userscript } from '../common/userscript'
import { outageListing } from './outageListingUserscript'
import { serviceOutage } from './serviceOutageUserscript'
import { OutageCache, OutageCacheClass } from './outageCache'
import { CardLoadingAPI, Card } from '../dashboardcomponents/datatypes'

export interface OutageLoadingAPI extends OutageAPI, CardLoadingAPI<Card>{
}

class OutageBreakdownAPIClass implements OutageLoadingAPI {
    isLoading: boolean
    outageBreakdowns: OutageBreakdown[]
    private cache: OutageCacheClass
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]
    constructor() {
        this.isLoading = false
        this.onIsLoadingChangeCallbacks = []
        this.outageBreakdowns = []
        this.cache = OutageCache
    }
    get outageBreakdown(): OutageBreakdown[] {
        return this.outageBreakdowns
    }
    get cards(): Card[] {
        return this.outageBreakdowns.map(toOutageBreakdownCard)
    }
    registerOnIsLoadingChange(onChange: (isLoading: boolean) => void) {
        this.onIsLoadingChangeCallbacks.push(onChange)
    }
    private onIsLoadingChange(isLoading: boolean) {
        this.onIsLoadingChangeCallbacks.forEach(onChange => onChange(isLoading))
    }

    async load(force: boolean = false): Promise<OutageBreakdown[]> {
        this.isLoading = true
        this.onIsLoadingChange(this.isLoading)
        if (!force) {
            const existingBreakdowns = this.cache.getBreakdowns()
            if (existingBreakdowns) {
                this.outageBreakdowns = existingBreakdowns
                this.isLoading = false
                this.onIsLoadingChange(this.isLoading)
                return this.outageBreakdowns
            }
        }

        try {
            this.outageBreakdowns = await aggregateOutages()
            this.cache.storeBreakdowns(this.outageBreakdowns)
        } finally {
            this.isLoading = false
            this.onIsLoadingChange(this.isLoading)
        }
        return this.outageBreakdowns
    }
    async loadCards(force: boolean = false): Promise<Card[]> {
        return (await this.load(force)).map(toOutageBreakdownCard)
    }

}
export const OutageBreakdownAPI: OutageLoadingAPI = new OutageBreakdownAPIClass()
export const GeoblackoutOutageCollectingUserscripts: Userscript[] = [
    outageListing,
    serviceOutage,
]
