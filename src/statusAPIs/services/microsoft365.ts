// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab
// @include     https://status.cloud.microsoft/m365
import { ServiceStatus, ServiceAPI } from "../statustypes"
import { Persistence, PersistenceClass, PersistableStatus } from "../persistence"

const M365Persistence = Persistence('M365')
export const storeM365Status = (status: PersistableStatus) => {
    M365Persistence.storeStatus(status)
}
export const M365HealthStatusPage = 'https://status.cloud.microsoft/m365'

class M365Class implements ServiceAPI {
    isLoading: boolean
    statusPage = M365HealthStatusPage
    private data: ServiceStatus
    private persistence: PersistenceClass
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]
    constructor() {
        this.data = {
            statusPage: this.statusPage,
            dependentCompanies: [],
            serviceName: 'Microsoft 365',
            status: null,
            incidents: null
        }
        this.persistence = M365Persistence
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

export const Microsoft365: ServiceAPI = new M365Class()
