// @grant       GM_xmlhttpRequest
import { Status, Incident } from '../statustypes'
import { parseDate } from '../../common/datetime'

export type CDNStatusIncidents = {
    status: Status,
    incidents: Incident[]
}

export function fetchCDNStatus(cdnSummaryUrl: string): Promise<CDNStatusIncidents> {
    return new Promise<CDNStatusIncidents>((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: cdnSummaryUrl,
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
                const incidents: Incident[] = (content.incidents ?? []).map(incident => ({
                    timestamp: (parseDate(incident.created_at) ?? new Date()).getTime(),
                    impact: incident.impact,
                    status: incident.status,
                    updated: (parseDate(incident.updated_at) ?? new Date()).getTime(),
                    updates: incident.incident_updates.map((update: any) => ({
                        name: update.body,
                        status: update.status,
                        updated: (parseDate(update.updated_at) ?? new Date()).getTime(),
                    }))
                }))
                resolve({
                    status,
                    incidents
                })
            },
            onerror: (response) => {
                reject(new Error(`${cdnSummaryUrl} - ${response['error'] ?? response.statusText}`));
            }
        })
    })
}