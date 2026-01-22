import { AWS } from "./services/aws";
import { Azure } from "./services/azure";
import { GCP } from "./services/gcp"
import { OCI } from "./services/oci";
import { IBM } from "./services/ibm"
import { Fastly } from "./services/fastly";
import { CNDStatusServices } from "./services/cdnStatusServices";
import { Slack } from "./services/slack";
import { Microsoft365 } from "./services/microsoft365";
import { ServiceAPI, ServiceStatus, classifyServiceStatus, sortServiceIncidents } from "./statustypes";
import { Userscript } from "../common/userscript";
import { AWSHealthStatus } from "./userscripts/AWSHealthStatus";
import { AzureHealthStatus } from "./userscripts/AzureHealthStatus";
import { GCPHealthStatus } from "./userscripts/GCPHealthStatus";
import { OCIHealthStatus } from "./userscripts/OCIHealthStatus";
import { IBMHealthStatus } from "./userscripts/IBMHealthStatus";
import { FastlyHealthStatus } from "./userscripts/FastlyHealthStatus";
import { Microsoft365HealthStatus } from "../statusAPIs/userscripts/Microsoft365HealthStatus";
import { CardLoadingAPI, Card } from "../dashboardcomponents/datatypes";
import { toServiceStatusCard } from "./statustypes";

export interface ServiceLoadingAPI extends ServiceAPI, CardLoadingAPI<Card>{
}

class ServiceAPIsClass implements ServiceLoadingAPI {
    isLoading: boolean
    serviceStatuses: ServiceStatus[]
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]

    private serviceAPIs: ServiceAPI[] = [
        CNDStatusServices,
        AWS,
        Azure,
        GCP,
        OCI,
        IBM,
        Fastly,
        Slack,
        Microsoft365
    ]
    constructor() {
        this.isLoading = false
        this.onIsLoadingChangeCallbacks = []
        this.serviceStatuses = []
    }
    get serviceStatus(): ServiceStatus[] {
        return this.serviceStatuses
    }
    get cards(): Card[] {
        return this.serviceStatuses.map(toServiceStatusCard)
    }
    registerOnIsLoadingChange(onChange: (isLoading: boolean) => void) {
        this.onIsLoadingChangeCallbacks.push(onChange)
    }
    private onIsLoadingChange(isLoading: boolean) {
        this.onIsLoadingChangeCallbacks.forEach(onChange => onChange(isLoading))
    }

    async load(force: boolean = false): Promise<ServiceStatus[]> {
        this.isLoading = true
        this.onIsLoadingChange(this.isLoading)
        const apiToServiceStatus = async (api: ServiceAPI): Promise<ServiceStatus[]> => {
            const result: ServiceStatus[] = []
            const statuses = await api.load(force)
            for ( const status of statuses) {
                result.push(await classifyServiceStatus(status))
            }
            return result.map(sortServiceIncidents)
        }

        try {
            
            this.serviceStatuses = (await Promise.all(this.serviceAPIs.map(apiToServiceStatus))).flat()
        } finally {
            this.isLoading = false
            this.onIsLoadingChange(this.isLoading)
        }
        return this.serviceStatuses
    }
    async loadCards(force: boolean = false): Promise<Card[]> {
        return (await this.load(force)).map(toServiceStatusCard)
    }
}
export const StatusAPIs: ServiceLoadingAPI = new ServiceAPIsClass()
export const StatusAPIUserscripts: Userscript[] = [
  AWSHealthStatus,
  AzureHealthStatus,
  GCPHealthStatus,
  OCIHealthStatus,
  IBMHealthStatus,
  FastlyHealthStatus,
  Microsoft365HealthStatus,
]