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
    storeStatus(status: PersistableStatus) {
        GM_setValue(this.serviceStatusVariableName, JSON.stringify({
            timestamp: Date.now(),
            status
        }))
    }
    getStatus(): PersistableStatus | null {
        let timestampStatus = GM_getValue(this.serviceStatusVariableName);
        if (timestampStatus) {
            timestampStatus = JSON.parse(timestampStatus)
        }
        if (timestampStatus && timestampStatus.timestamp < Date.now() - StaleDuration) {
            GM_deleteValue(this.serviceStatusVariableName);
            timestampStatus = null;
        }
        return timestampStatus ? timestampStatus.status : null;    
    }
    awaitStatus(): Promise<PersistableStatus> {
        return new Promise<PersistableStatus>(resolve => {
            const listenerId = GM_addValueChangeListener(
                this.serviceStatusVariableName,
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