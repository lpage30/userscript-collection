// @grant       GM_xmlhttpRequest
// @connect     slack-status.com
import { ServiceStatus, ServiceAPI } from "../statustypes"
import { Persistence, PersistenceClass } from "../persistence"
import { Status, Incident } from '../statustypes'
import { parseDate } from '../../common/datetime'

class SlackClass implements ServiceAPI {
    isLoading: boolean
    statusPage = 'https://slack-status.com'
    private summaryUrl = 'https://slack-status.com/api/v2.0.0/current'
    private data: ServiceStatus
    private persistence: PersistenceClass
    private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]

    constructor() {
        this.persistence = Persistence('Slack')
        this.data = {
            statusPage: this.statusPage,
            dependentCompanies: [],
            serviceName: 'Slack',
            status: { timestamp: 0, description: '', indicator: '' },
            incidents: []
        }
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
            if (!force) {
                const existingStatus = this.persistence.getStatus()
                if (existingStatus) {
                    this.data.status = existingStatus.status
                    this.data.incidents = existingStatus.incidents ?? []
                    this.isLoading = false
                    this.onIsLoadingChange(this.isLoading)
                    return [this.data]
                }
            }
            const newStatus = await new Promise<{ status: Status, incidents: Incident[] }>((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: this.summaryUrl,
                    headers: {
                        Accept: "application/json",
                    },
                    onload: (response: GM_xmlhttpRequestResponse) => {
                        if (response.status < 200 || 300 <= response.status) {
                            reject(new Error(response.statusText))
                            return
                        }
                        const content = JSON.parse(response.responseText);
                        const status: Status = {
                            timestamp: (parseDate(content.date_updated) ?? new Date()).getTime(),
                            description: content.status,
                            indicator: content.status,
                        }
                        const incidents: Incident[] = content.active_incidents.map((incident: any) => ({
                            timestamp: (parseDate(incident.date_created) ?? new Date()).getTime(),
                            impact: incident.status,
                            status: incident.status,
                            updated: (parseDate(incident.date_updated) ?? new Date()).getTime(),
                            updates: [{
                                name: incident.title,
                                status: incident.status,
                                updated: (parseDate(incident.date_updated) ?? new Date()).getTime(),
                            },
                            ...(incident.notes ?? []).map((note: any) => ({
                                name: note.body,
                                status: incident.status,
                                updated: (parseDate(note.date_created) ?? new Date()).getTime(),

                            }))
                            ]
                        }))
                        resolve({
                            status,
                            incidents
                        })
                    },
                    onerror: (response) => {
                        reject(new Error(`${this.summaryUrl} - ${response['error'] ?? response.statusText}`));
                    }
                })
            })
            this.data.status = newStatus.status
            this.data.incidents = newStatus.incidents ?? []
            this.persistence.storeStatus(newStatus)
        }
        finally {
            this.isLoading = false
            this.onIsLoadingChange(this.isLoading)
        }
        return [this.data]
    }
}
export const Slack: ServiceAPI = new SlackClass()