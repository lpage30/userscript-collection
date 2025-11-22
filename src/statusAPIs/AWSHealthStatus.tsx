// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
import React from "react";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitElementById,
  awaitDelay
} from "../common/await_functions";
import { parseDateTime } from "../common/datetime";
import { Status, Incident, IncidentUpdate, StatusType, ImpactType, IndicatorType } from "./statustypes";
import { storeAWSStatus } from "./aws";

const toStatusImpactIndicator = (awsStatus: string): { status: StatusType, impact: ImpactType, indicator: IndicatorType} => {
  switch(awsStatus) {
    case 'No recent issues':
    case 'No Reported Event':
      return {
        status: 'healthy',
        impact: 'none',
        indicator: 'none'
      }
    default:
      return {
        status: awsStatus,
        impact: awsStatus,
        indicator: awsStatus
      }

  }
}

async function scrapeServiceStatusMap(pageNo: number, hasNextPage: boolean): Promise<{ [service: string]: {service: string, region: string, status: string}[]}> {
  const pageinationVariableName = 'aws_pagination_aggregate'
  const serviceTable = await awaitElementById('status-history-service-list-table')
  const initial: { [service: string]: {service: string, region: string, status: string}[]} = 1 < pageNo 
    ? JSON.parse(GM_getValue(pageinationVariableName, JSON.stringify({})))
    : {}
  console.log(`Page ${pageNo}, More Pages: ${hasNextPage}`)
  const result = Array.from(serviceTable.querySelectorAll('tr[data-selection-item="item"]')).map(row => ({
    serviceName: (row.children[0] as HTMLElement).innerText,
    status: row.children[2].children[0].children[0].children[0].ariaLabel
  })).reduce((serviceMap, serviceStatus) => {
    const serviceRegionRegex = /([^\(]*)\(([^\)]*)\)/g
    let serviceName = serviceStatus.serviceName
    let region = 'global'
    const svcResult = serviceRegionRegex.exec(serviceStatus.serviceName)
    if (svcResult !== null) {
      serviceName = svcResult[1].trim()
      region = svcResult[2].trim()
    }
    if (serviceMap[serviceName] === undefined) {
      serviceMap[serviceName] = []
    }
    serviceMap[serviceName].push({
      service: serviceName,
      region,
      status: serviceStatus.status
    })
    return serviceMap

  }, initial)
  if (hasNextPage) {
    GM_setValue(pageinationVariableName, JSON.stringify(result))
  } else {
    GM_deleteValue(pageinationVariableName)
  }
  return result
}

export const AWSHealthStatusPage = 'https://health.aws.com/health/status'
export const AWSHealthStatus: Userscript = {
  name: "AWSHealthStatus",

  isSupported: (href: string): boolean =>
    href.startsWith(AWSHealthStatusPage),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    await awaitDelay(1000)
    let hasNextPage = true
    let currentPageNo = 0
    while(hasNextPage) {
      if (0 < currentPageNo) {
        await awaitDelay(50)
      }
      const pages = Array.from(document.querySelector('ul[aria-label="Table pagination"]').querySelectorAll('button'))
      currentPageNo = parseInt(pages.filter(button => button.ariaCurrent === 'true')[0].innerText)
      const nextPage = pages.slice(-1)[0]
      hasNextPage = !nextPage.disabled
      const serviceStatusMap = await scrapeServiceStatusMap(currentPageNo, hasNextPage)
      if (nextPage.disabled) {
        const eventState = document.querySelector('div[class*="event-state"]') as HTMLElement
        const indicator = (eventState.firstElementChild as HTMLElement).dataset.analytics
        const overallStatus = eventState.innerText.split('\n')
        const statusText = overallStatus[0].trim()
        const timestamp = parseDateTime(overallStatus[1]) ?? new Date()
        const services = Object.keys(serviceStatusMap)
        const status: { status: Status, incidents: Incident[] } = {
          status: {
            timestamp: timestamp.getTime(),
            description: statusText,
            indicator
          },
          incidents: services.map(serviceName => {
            const statusObj: any = {
              timestamp: timestamp.getTime(),
              impactCountMap: {},
              statusCountMap: {}
            }
            return {
              timestamp: timestamp.getTime(),
              name: serviceName,
              updated: timestamp.getTime(),
              updates: serviceStatusMap[serviceName].map(regions => {
                const { status, impact } = toStatusImpactIndicator(regions.status)
                statusObj.impactCountMap[impact] = (statusObj.impactCountMap[impact] ?? 0) + 1
                statusObj.statusCountMap[status] = (statusObj.statusCountMap[status] ?? 0) + 1
                return {
                  name: regions.region,
                  status,
                  updated: timestamp.getTime()
                } as IncidentUpdate
              }),
              status: Object.entries(statusObj.statusCountMap as { [name: string]: number })
                .reduce((nameMaxCount, [name, count]) => {
                  if (count > nameMaxCount.maxCount) {
                    return { name, maxCount: count}
                  }
                }, { name: '', maxCount: 0} as {name: string, maxCount: number}).name,
              impact: Object.entries(statusObj.impactCountMap as { [name: string]: number })
                .reduce((nameMaxCount, [name, count]) => {
                  if (count > nameMaxCount.maxCount) {
                    return { name, maxCount: count}
                  }
                }, { name: '', maxCount: 0} as {name: string, maxCount: number}).name,

            } as Incident
          }),
        }
        storeAWSStatus(status)
        break
      } else {
        nextPage.click()
      }
    }
  },
};
