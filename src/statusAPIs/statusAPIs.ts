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

class ServiceAPIsClass implements ServiceAPI {
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
    registerOnIsLoadingChange(onChange: (isLoading: boolean) => void) {
        this.onIsLoadingChangeCallbacks.push(onChange)
    }
    private onIsLoadingChange(isLoading: boolean) {
        this.onIsLoadingChangeCallbacks.forEach(onChange => onChange(isLoading))
    }

    async load(force: boolean = false): Promise<ServiceStatus[]> {
        this.isLoading = true
        this.onIsLoadingChange(this.isLoading)
        try {
            this.serviceStatuses = (await Promise.all(
                this.serviceAPIs
                 .map(async api => (await api.load(force))
                        .map(classifyServiceStatus)
                        .map(sortServiceIncidents)
                )
            )).flat()
        } finally {
            this.isLoading = false
            this.onIsLoadingChange(this.isLoading)
        }
        return this.serviceStatuses
    }
}
export const StatusAPIs: ServiceAPI = new ServiceAPIsClass()