import { Cloudflare } from "./cloudflare";
import { AWS } from "./aws";
import { ServiceAPI, ServiceStatus } from "./statustypes";

class ServiceAPIsClass implements ServiceAPI {
    isLoading: boolean
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]

    private serviceAPIs: ServiceAPI[] = [
        Cloudflare,
        AWS
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
        const result: ServiceStatus[] = []
        for (const api of this.serviceAPIs) {
            result.push(...(await api.load(force)))
        }
        this.isLoading = false
        this.onIsLoadingChange(this.isLoading)
        return result
    }
}
export const StatusAPIs: ServiceAPI = new ServiceAPIsClass()