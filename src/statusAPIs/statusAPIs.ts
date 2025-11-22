import { Cloudflare } from "./cloudflare";
import { AWS } from "./aws";
import { ServiceAPI, ServiceStatus } from "./statustypes";

class ServiceAPIsClass implements ServiceAPI {
    private serviceAPIs: ServiceAPI[] = [
        Cloudflare,
        AWS
    ]
    constructor() {
    }
    get serviceStatus(): ServiceStatus[] {
        return this.serviceAPIs.map(api => api.serviceStatus).flat()
    }
    async load(): Promise<ServiceStatus[]> {
        const result: ServiceStatus[] = []
        for (const api of this.serviceAPIs) {
            result.push(...(await api.load()))
        }
        return result
    }
}
export const StatusAPIs: ServiceAPI = new ServiceAPIsClass()