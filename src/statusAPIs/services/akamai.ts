// @connect     akamaistatus.com
import { ServiceStatus, ServiceAPI } from "../statustypes"
import { Persistence, PersistenceClass } from "../persistence"
import { AkamaiDependentCompanies } from "../servicedependentcompanylists"
import { fetchCDNStatus } from "./cdnstatuspageAPIFunctions"

class AkamaiClass implements ServiceAPI {
    isLoading: boolean
    statusPage = 'https://www.akamaistatus.com/'
    private summaryURL = 'https://www.akamaistatus.com/api/v2/summary.json'
    private data: ServiceStatus
    private persistence: PersistenceClass
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]

    constructor() {
        this.persistence = Persistence('Akamai')
        this.data = {
            statusPage: this.statusPage,
            dependentCompanies: AkamaiDependentCompanies,
            serviceName: 'Akamai',
            status: null,
            incidents: null
        }
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

        try {
            const newStatus = await fetchCDNStatus(this.summaryURL)
            this.data.status = newStatus.status
            this.data.incidents = newStatus.incidents
            this.persistence.storeStatus(newStatus)
        }
        finally {
            this.isLoading = false
            this.onIsLoadingChange(this.isLoading)
        }
        return [this.data]
    }
}
export const Akamai: ServiceAPI = new AkamaiClass()