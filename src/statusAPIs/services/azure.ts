// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab
// @include     https://azure.status.microsoft/en-us/status
import { ServiceStatus, ServiceAPI } from "../statustypes"
import { Persistence, PersistenceClass, PersistableStatus } from "../persistence"
import { AzureDependentCompanies } from "../servicedependentcompanylists"

const azurePersistence = Persistence('Azure')
export const storeAzureStatus = (status: PersistableStatus) => {
    azurePersistence.storeStatus(status)
}
export const AzureHealthStatusPage = 'https://azure.status.microsoft/en-us/status'
class AzureClass implements ServiceAPI {
    isLoading: boolean
    statusPage = AzureHealthStatusPage
    private data: ServiceStatus
    private persistence: PersistenceClass
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]
    constructor() {
        this.data = {
            statusPage: this.statusPage,
            dependentCompanies: AzureDependentCompanies,
            serviceName: 'Microsoft Azure',
            status: { timestamp: 0, description: '', indicator: '' },
            incidents: []
        }
        this.persistence = azurePersistence
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
        try {
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
            const pendingStatus = this.persistence.awaitStatus()
            const tab = GM_openInTab(this.statusPage, { active: false })
            const scrapedStatus = await pendingStatus
            if (tab && !tab.closed) {
                tab.close()
            }
            this.data.status = scrapedStatus.status
            this.data.incidents = scrapedStatus.incidents
        } finally {
            this.isLoading = false
            this.onIsLoadingChange(this.isLoading)
        }
        return [this.data]
    }
}

export const Azure: ServiceAPI = new AzureClass()
