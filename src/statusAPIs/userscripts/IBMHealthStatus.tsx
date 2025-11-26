// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://cloud.ibm.com/status
import React from "react";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitQuerySelection
} from "../../common/await_functions";
import { PersistableStatus } from "../persistence";
import { Status, Incident } from "../statustypes";
import { storeIBMStatus, IBMHealthStatusPage } from "../services/ibm";
import { getMaxOccurringValidStatus, NoStatusStatus } from "../conversionfunctions";

async function scrapeIncidents(): Promise<Incident[]> {
  const timestamp = Date.now()
  const table = await awaitQuerySelection('tbody')
  return Array.from(table.children)
    .map(tr => Array.from(tr.children)
      .map(td => (td as HTMLElement).innerText.trim())
      .filter(t => 0 < t.length)
    )
    .map(([service, status]) => ({ service, status: /\d+ (.*)/g.exec(status)[1] }))
    .reduce((result, serviceStatus) => {
      return [...result, {
        timestamp,
        impact: getMaxOccurringValidStatus([serviceStatus.status]) === NoStatusStatus ? 'none' : serviceStatus.status,
        name: serviceStatus.service,
        status: getMaxOccurringValidStatus([serviceStatus.status]),
        updated: timestamp,
        updates: [],
      } as Incident
      ]
    }, [] as Incident[])

}
function toPersistableStatus(incidents: Incident[]): PersistableStatus {
  const timestamp = Date.now()
  const overallStatus = getMaxOccurringValidStatus(incidents.map(({ status }) => status))
  return {
    status: {
      timestamp,
      description: overallStatus,
      indicator: overallStatus
    } as Status,
    incidents
  }
}

export const IBMHealthStatus: Userscript = {
  name: "IBMHealthStatus",

  isSupported: (href: string): boolean =>
    href.startsWith(IBMHealthStatusPage),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByEvent();
    const incidents = await scrapeIncidents()
    storeIBMStatus(toPersistableStatus(incidents))
  }
}