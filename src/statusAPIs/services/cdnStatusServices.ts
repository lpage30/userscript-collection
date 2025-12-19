// @connect     zoomstatus.com
// @connect     discordstatus.com
// @connect     githubstatus.com
// @connect     openai.com
// @connect     atlassian.com
// @connect     redhat.com
// @connect     mongodb.com
// @connect     influxdata.com
// @connect     hubspot.com
// @connect     redditstatus.com
// @connect     akamaistatus.com
// @connect     cloudflarestatus.com
// @connect     digitalocean.com
import { ServiceStatus, ServiceAPI } from "../statustypes"
import { Persistence, PersistenceClass } from "../persistence"
import { AkamaiDependentCompanies, CloudflareDependentCompanies, DigitalOceanDependentCompanies } from "../servicedependentcompanylists"
import { fetchCDNStatus } from "./cdnstatuspageAPIFunctions"
import { toTitleCase } from "../../common/functions"

const cdnAPISupportedSites = {
    zoom: {
        summaryURL: 'https://www.zoomstatus.com/api/v2/summary.json',
        statusPage: 'https://www.zoomstatus.com',
        dependentCompanies: [],
    },
    discord: {
        summaryURL: 'https://discordstatus.com/api/v2/summary.json',
        statusPage: 'https://discordstatus.com',
        dependentCompanies: [],
    },
    github: {
        summaryURL: 'https://www.githubstatus.com/api/v2/summary.json',
        statusPage: 'https://www.githubstatus.com',
        dependentCompanies: [],
    },
    openai: {
        summaryURL: 'https://status.openai.com/api/v2/summary.json',
        statusPage: 'https://status.openai.com',
        dependentCompanies: [],
    },
    atlassian: {
        summaryURL: 'https://status.atlassian.com/api/v2/summary.json',
        statusPage: 'https://status.atlassian.com',
        dependentCompanies: [],
    },
    redhat: {
        summaryURL: 'https://status.redhat.com/api/v2/summary.json',
        statusPage: 'https://status.redhat.com',
        dependentCompanies: [],
    },
    mongoDB: {
        summaryURL: 'https://status.mongodb.com/api/v2/summary.json',
        statusPage: 'https://status.mongodb.com',
        dependentCompanies: [],
    },
    influxDB: {
        summaryURL: 'https://status.influxdata.com/api/v2/summary.json',
        statusPage: 'https://status.influxdata.com',
        dependentCompanies: [],
    },
    hubspot: {
        summaryURL: 'https://status.hubspot.com/api/v2/summary.json',
        statusPage: 'https://status.hubspot.com',
        dependentCompanies: [],
    },
    reddit: {
        summaryURL: 'https://www.redditstatus.com/api/v2/summary.json',
        statusPage: 'https://www.redditstatus.com',
        dependentCompanies: [],
    },
    akamai: {
        summaryURL: 'https://www.akamaistatus.com/api/v2/summary.json',
        statusPage: 'https://www.akamaistatus.com',
        dependentCompanies: AkamaiDependentCompanies,
    },
    cloudflare: {
        summaryURL: 'https://www.cloudflarestatus.com/api/v2/summary.json',
        statusPage: 'https://www.cloudflarestatus.com',
        dependentCompanies: CloudflareDependentCompanies,
    },
    digitalOcean: {
        summaryURL: 'https://status.digitalocean.com/api/v2/summary.json',
        statusPage: 'https://status.digitalocean.com',
        dependentCompanies: DigitalOceanDependentCompanies,
    },
}
class CDNStatusAPIServicesClass implements ServiceAPI {
    isLoading: boolean
    private data: { [service: string]: ServiceStatus }
    private persistence: { [service: string]: PersistenceClass }
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]

    constructor() {
        this.persistence = Object.keys(cdnAPISupportedSites).reduce((persistenceMap, service) => ({
            ...persistenceMap,
            [service]: Persistence(`${service.charAt(0).toUpperCase()}${service.slice(1)}`)
        }), {})
        this.data = Object.keys(cdnAPISupportedSites).reduce((serviceMap, key) => ({
            ...serviceMap,
            [key]: {
                statusPage: cdnAPISupportedSites[key].statusPage,
                dependentCompanies: cdnAPISupportedSites[key].dependentCompanies,
                serviceName: toTitleCase(key),
                status: { timestamp: 0, description: '', indicator: '' },
                incidents: []
            }
        }), {})
        this.isLoading = false
        this.onIsLoadingChangeCallbacks = []
    }
    get serviceStatus(): ServiceStatus[] {
        return Object.values(this.data)
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
            let fetchServiceNames = Object.keys(cdnAPISupportedSites)
            if (!force) {
                Object.keys(cdnAPISupportedSites).forEach(serviceName => {
                    const existingStatus = this.persistence[serviceName].getStatus()
                    if (existingStatus) {
                        this.data[serviceName].status = existingStatus.status
                        this.data[serviceName].incidents = existingStatus.incidents ?? []
                        fetchServiceNames = fetchServiceNames.filter(name => name !== serviceName)
                    }
                })
            }
            await Promise.all(fetchServiceNames.map(serviceName =>
                fetchCDNStatus(cdnAPISupportedSites[serviceName].summaryURL)
                    .then(newStatus => {
                        this.data[serviceName].status = newStatus.status
                        this.data[serviceName].incidents = newStatus.incidents ?? []
                        this.persistence[serviceName].storeStatus(newStatus)
                    })
                )
            )
        }
        finally {
            this.isLoading = false
            this.onIsLoadingChange(this.isLoading)
        }
        return Object.values(this.data)
    }
}
export const CNDStatusServices: ServiceAPI = new CDNStatusAPIServicesClass()