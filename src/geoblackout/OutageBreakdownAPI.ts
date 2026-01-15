import { OutageBreakdown, OutageAPI } from './outageBreakdownAPItypes'
import { aggregateOutages } from './outageAggregator'
import { Userscript } from '../common/userscript'
import { outageListing } from './outageListingUserscript'
import { serviceOutage } from './serviceOutageUserscript'
import { OutageCache, OutageCacheClass } from './outageCache'

class OutageBreakdownAPIClass implements OutageAPI {
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
}
export const OutageBreakdownAPI = new OutageBreakdownAPIClass()
export const GeoblackoutOutageCollectingUserscripts: Userscript[] = [
    outageListing,
    serviceOutage,
]
