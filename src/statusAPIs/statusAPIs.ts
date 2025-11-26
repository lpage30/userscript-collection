import { Cloudflare } from "./services/cloudflare";
import { AWS } from "./services/aws";
import { Azure } from "./services/azure";
import { GCP } from "./services/gcp"
import { OCI } from "./services/oci";
import { IBM } from "./services/ibm"
import { DigitalOcean } from "./services/digitalocean";
import { Akamai } from "./services/akamai";
import { Fastly } from "./services/fastly";
import { ServiceAPI, ServiceStatus } from "./statustypes";

class ServiceAPIsClass implements ServiceAPI {
    isLoading: boolean
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]

    private serviceAPIs: ServiceAPI[] = [
        Cloudflare,
        AWS,
        Azure,
        GCP,
        OCI,
        IBM,
        DigitalOcean,
        Akamai,
        Fastly,
    ]
    constructor() {
        this.isLoading = false
        this.onIsLoadingChangeCallbacks = []
    }
    get serviceStatus(): ServiceStatus[] {
        return this.serviceAPIs.map(api => api.serviceStatus).flat()
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
        const result: ServiceStatus[] = (await Promise.all(this.serviceAPIs.map(api => api.load(force)))).flat()
        this.isLoading = false
        this.onIsLoadingChange(this.isLoading)
        return result
    }
}
export const StatusAPIs: ServiceAPI = new ServiceAPIsClass()