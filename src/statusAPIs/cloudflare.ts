// @grant       GM_xmlhttpRequest
// @connect     *.cloudflarestatus.com
import { Status, Incident, ServiceStatus, ServiceAPI } from "./statustypes"
import { parseDate } from "../common/datetime"
import { Persistence, PersistenceClass } from "./persistence"

class CloudflareClass implements ServiceAPI {
  isLoading: boolean
  statusPage = 'https://www.cloudflarestatus.com/'
  private summaryURL = 'https://www.cloudflarestatus.com/api/v2/summary.json'
  private data: ServiceStatus
  private persistence: PersistenceClass
  private onIsLoadingChangeCallbacks: ((isLoading: boolean) => void)[]

  constructor() {
    this.persistence = Persistence('Cloudflare')
    this.data = {
      statusPage: this.statusPage,
      serviceName: 'Cloudflare',
      status: null,
      incidents: null
    }
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
    return new Promise<ServiceStatus[]>((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: this.summaryURL,
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
            timestamp: Date.now(),
            description: content.status.description,
            indicator: content.status.indicator
          }
          const incidents: Incident[] = content.incidents.map(incident => ({
            timestamp: (parseDate(incident.created_at) ?? new Date()).getTime(),
            impact: incident.impact,
            status: incident.status,
            updated: (parseDate(incident.updated_at) ?? new Date()).getTime(),
            updates: incident.incident_updates.map(update => ({
              name: update.body,
              status: update.status,
              updated: (parseDate(update.updated_at) ?? new Date()).getTime(),
            }))
          }))
          this.data.status = status
          this.data.incidents = incidents
          this.persistence.storeStatus({status, incidents})
          this.isLoading = false
          this.onIsLoadingChange(this.isLoading)
          resolve([this.data])
        },
        onerror: (response) => {
          this.isLoading = false
          this.onIsLoadingChange(this.isLoading)
          reject(new Error(response['error'] ?? response.statusText));
        }
      })
    })
  }
}
export const Cloudflare: ServiceAPI = new CloudflareClass()