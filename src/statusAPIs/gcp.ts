// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab
import { ServiceStatus, ServiceAPI } from "./statustypes"
import { Persistence, PersistenceClass, PersistableStatus } from "./persistence"
import { getMaxOccurringValidStatus } from "./conversionfunctions"

export const GCPZonePageUrlMap = {
    overview: 'https://status.cloud.google.com/index.html',
    americas: 'https://status.cloud.google.com/regional/americas',
    europe: 'https://status.cloud.google.com/regional/europe',
    asiapacific: 'https://status.cloud.google.com/regional/asia',
    middleeast: 'https://status.cloud.google.com/regional/middle-east',
    africa: 'https://status.cloud.google.com/regional/africa',
    multiregion: 'https://status.cloud.google.com/regional/multiregions'
}

const gcpPersistence = Persistence('gcp')
export const storeGCPStatus = (zone: string, status: PersistableStatus) => {
    gcpPersistence.storeStatus(status, zone)
}

class GCPClass implements ServiceAPI {
    isLoading: boolean
    statusPage = 'https://status.cloud.google.com/'
    private data: ServiceStatus
    private persistence: PersistenceClass
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]
    constructor() {
        this.data = {
            statusPage: this.statusPage,
            serviceName: 'Google GCP',
            status: null,
            incidents: null
        }
        this.persistence = gcpPersistence
        this.isLoading = false
        this.onIsLoadingChangeCallbacks = []
    }
    get serviceStatus(): ServiceStatus[] {
        return [this.data]
    }
    registerOnIsLoadingChange(onChange: (isLoading: boolean) => void) {
        this.onIsLoadingChangeCallbacks.push(onChange)
    }
    private onIsLoadingChange(isLoading: boolean) {
        this.onIsLoadingChangeCallbacks.forEach(onChange => onChange(isLoading))
    }

    async load(force: boolean): Promise<ServiceStatus[]> {
        this.isLoading = true
        this.onIsLoadingChange(this.isLoading)
        if (!force) {
            const existingStatus = this.persistence.getStatus()
            if (existingStatus) {
                this.data.status = existingStatus.status
                this.data.incidents = existingStatus.incidents
                this.isLoading = false
                this.onIsLoadingChange(this.isLoading)
                return [this.data]
            }
        }
        const loadArray = Object.entries(GCPZonePageUrlMap)
            .map(([zone, url]) => {
                return async (): Promise<PersistableStatus> => {
                    const pendingStatus = this.persistence.awaitStatus(zone)
                    const tab = GM_openInTab(url, { active: false})
                    const scrapedStatus = await pendingStatus
                    if (tab && !tab.closed) {
                        tab.close()
                    }
                    return scrapedStatus
                }
            })
        const statuses = await Promise.all(loadArray.map(load => load()))
        const timestamps = statuses.map(({status}) => status.timestamp)
        const descriptions = statuses.map(({status}) => status.description)
        const indicators = statuses.map(({status}) => status.indicator)
        this.data.status = {
            timestamp: Math.min(...timestamps),
            description: getMaxOccurringValidStatus(descriptions),
            indicator: getMaxOccurringValidStatus(indicators)
        }
        this.data.incidents = statuses.map(({incidents}) => incidents).flat()
        this.persistence.storeStatus({
            status: this.data.status,
            incidents: this.data.incidents
        })
        this.isLoading = false
        this.onIsLoadingChange(this.isLoading)
        return [this.data]
    }
}

export const GCP: ServiceAPI = new GCPClass()