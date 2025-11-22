// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab
import { ServiceStatus, Status, Incident, ServiceAPI } from "./statustypes"

const AWSStatusVariableName = 'aws_statuses'
export const storeAWSStatus = (status: { status: Status, incidents: Incident[] }) => {
    GM_setValue(AWSStatusVariableName, JSON.stringify(status))
}

const loadAWSStatus = (): Promise<{ status: Status, incidents: Incident[] }> => new Promise<{ status: Status, incidents: Incident[] }>((resolve) => {
    const listenerId = GM_addValueChangeListener(
        AWSStatusVariableName,
        (name: string, oldValue: any, newValue: any, remote: boolean) => {
            GM_removeValueChangeListener(listenerId ?? "");
            resolve(JSON.parse(newValue))
        }
    )
})

class AWSClass implements ServiceAPI {
    statusPage = 'https://health.aws.com/health/status'
    private data: ServiceStatus

    constructor() {
        this.data = {
            statusPage: this.statusPage,
            serviceName: 'AWS',
            status: null,
            incidents: null
        }
    }
    get serviceStatus(): ServiceStatus[] {
        return [this.data]
    }
    async load(): Promise<ServiceStatus[]> {
        const loadStatusPromise = loadAWSStatus()
        const tab = GM_openInTab(this.statusPage, { active: false})
        const { status, incidents } = await loadStatusPromise
        if (tab && !tab.closed) {
            tab.close()
        }
        this.data.status = status
        this.data.incidents = incidents
        return [this.data]
    }
}

export const AWS: ServiceAPI = new AWSClass()
