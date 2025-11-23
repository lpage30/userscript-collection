// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
import { Status, Incident } from "./statustypes"
import { ONE_MINUTE } from '../common/datetime';

export const StaleDuration = 10 * ONE_MINUTE;
export type PersistableStatus = { status: Status, incidents: Incident[] }

export class PersistenceClass {
    private serviceStatusVariableName: string
    constructor(servicePrefix: string) {
        this.serviceStatusVariableName = `${servicePrefix}_service_status`
    }
    storeStatus(status: PersistableStatus, serviceSuffix?: string) {
        const variableName = serviceSuffix ? `${this.serviceStatusVariableName}_${serviceSuffix}`: this.serviceStatusVariableName
        GM_setValue(variableName, JSON.stringify({
            timestamp: Date.now(),
            status
        }))
    }
    getStatus(serviceSuffix?: string): PersistableStatus | null {
        const variableName = serviceSuffix ? `${this.serviceStatusVariableName}_${serviceSuffix}`: this.serviceStatusVariableName
        let timestampStatus = GM_getValue(variableName);
        if (timestampStatus) {
            timestampStatus = JSON.parse(timestampStatus)
        }
        if (timestampStatus && timestampStatus.timestamp < Date.now() - StaleDuration) {
            GM_deleteValue(variableName);
            timestampStatus = null;
        }
        return timestampStatus ? timestampStatus.status : null;    
    }
    awaitStatus(serviceSuffix?: string): Promise<PersistableStatus> {
        const variableName = serviceSuffix ? `${this.serviceStatusVariableName}_${serviceSuffix}`: this.serviceStatusVariableName
        return new Promise<PersistableStatus>(resolve => {
            const listenerId = GM_addValueChangeListener(
                variableName,
                (name: string, oldValue: any, newValue: any, remote: boolean) => {
                    GM_removeValueChangeListener(listenerId ?? "");
                    const timestampStatus = JSON.parse(newValue)
                    resolve(timestampStatus.status)
                }
            )
        })
    }
}
export const Persistence = (servicePrefix: string) => new PersistenceClass(servicePrefix)