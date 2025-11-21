// @grant       GM_xmlhttpRequest
// @connect     *.cloudflarestatus.com
import { Status, Incident, ServiceStatus, ServiceAPI } from "./statustypes"
import { parseDate } from "../common/datetime"
class CloudflareClass implements ServiceAPI{
  statusPage: 'https://www.cloudflarestatus.com/'
  private summaryURL = 'https://www.cloudflarestatus.com/api/v2/summary.json'
  private data: ServiceStatus
  constructor() {
    this.data = {
      statusPage: this.statusPage,
      serviceName: 'Cloudflare',
      status: null,
      incidents: null
    }
  }
  get serviceStatus(): ServiceStatus {
    return this.data
  }
  load(): Promise<ServiceStatus> {
    return new Promise<ServiceStatus>((resolve, reject) => {
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
          resolve(this.data)
        },
        onerror: (response) => {
          reject(new Error(response['error'] ?? response.statusText));
        }
      })
    })
  }
}
export const Cloudflare: ServiceAPI = new CloudflareClass()