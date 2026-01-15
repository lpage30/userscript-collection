// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
import { OutageBreakdown } from "./outageBreakdownAPItypes";
import { ONE_MINUTE } from '../common/datetime';

export const StaleDuration = 10 * ONE_MINUTE;

export class OutageCacheClass {
    private serviceVariableName = 'geoblackout-outage-cache'
    storeBreakdowns(breakdowns: OutageBreakdown[]) {
        GM_setValue(this.serviceVariableName, JSON.stringify({
            timestamp: Date.now(),
            breakdowns
        }))
    }
    getBreakdowns(): OutageBreakdown[] | null {
        let timestampStatus = GM_getValue(this.serviceVariableName);
        if (timestampStatus) {
            timestampStatus = JSON.parse(timestampStatus)
        }
        if (timestampStatus && timestampStatus.timestamp < Date.now() - StaleDuration) {
            GM_deleteValue(this.serviceVariableName);
            timestampStatus = null;
        }
        return timestampStatus ? timestampStatus.breakdowns : null;
    }

}
export const OutageCache = new OutageCacheClass()