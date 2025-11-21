import { Cloudflare } from "./cloudflare";
import { ServiceAPI, ServiceAPIs, ServiceStatus } from "./statustypes";

class ServiceAPIsClass implements ServiceAPIs {
    private serviceAPIs: ServiceAPI[] = [
        Cloudflare
    ]
    constructor() {
    }
    get serviceStatuses(): ServiceStatus[] {
        return this.serviceAPIs.map(api => api.serviceStatus)
    }
    async load(): Promise<ServiceStatus[]> {
        const result: ServiceStatus[] = []
        for (const api of this.serviceAPIs) {
            result.push(await api.load())
        }
        return result
    }
}
export const StatusAPIs: ServiceAPIs = new ServiceAPIsClass()