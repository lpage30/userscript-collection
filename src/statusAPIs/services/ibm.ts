// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab
// @include     https://cloud.ibm.com/status
import { ServiceStatus, ServiceAPI } from "../statustypes"
import { Persistence, PersistenceClass, PersistableStatus } from "../persistence"
import { IBMDependentCompanies } from "../servicedependentcompanylists"

const ibmPersistence = Persistence('Azure')
export const storeIBMStatus = (status: PersistableStatus) => {
    ibmPersistence.storeStatus(status)
}
export const IBMHealthStatusPage = 'https://cloud.ibm.com/status'
class IBMClass implements ServiceAPI {
    isLoading: boolean
    statusPage = IBMHealthStatusPage
    private data: ServiceStatus
    private persistence: PersistenceClass
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]
    constructor() {
        this.data = {
            statusPage: this.statusPage,
            dependentCompanies: IBMDependentCompanies,
            serviceName: 'IBM Cloud',
            status: null,
            incidents: null
        }
        this.persistence = ibmPersistence
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
        const pendingStatus = this.persistence.awaitStatus()
        const tab = GM_openInTab(this.statusPage, { active: false })
        const scrapedStatus = await pendingStatus
        if (tab && !tab.closed) {
            tab.close()
        }
        this.data.status = scrapedStatus.status
        this.data.incidents = scrapedStatus.incidents
        this.isLoading = false
        this.onIsLoadingChange(this.isLoading)
        return [this.data]
    }
}

export const IBM: ServiceAPI = new IBMClass()
