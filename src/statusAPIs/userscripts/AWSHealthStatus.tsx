// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://health.aws.com/health/status
import React from "react";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitElementById,
  awaitDelay
} from "../../common/await_functions";
import { parseDateTime } from "../../common/datetime";
import { Status, Incident, IncidentUpdate } from "../statustypes";
import { storeAWSStatus, AWSHealthStatusPage } from "../services/aws";
import { getMaxOccurringValidStatus, NoStatusStatus } from "../conversionfunctions";

const paginationAggregationVariableName = 'aws_paginated_status_aggregation'
type AWSHealthPageServiceRegion = { service: string, region: string, status: string }
type AWSHealthServiceMap = { [service: string]: AWSHealthPageServiceRegion[] }
function deletePaginatedAggregation() {
  GM_deleteValue(paginationAggregationVariableName)
}
function getPaginatedAggregation(): AWSHealthServiceMap | null {
  const result = GM_getValue(paginationAggregationVariableName)
  return result ? JSON.parse(result) : null
}
function storePaginatedAggregation(aggregate: AWSHealthServiceMap) {
  GM_setValue(paginationAggregationVariableName, JSON.stringify(aggregate))
}

async function scrapeServiceStatusMap(pageNo: number, hasNextPage: boolean): Promise<AWSHealthServiceMap> {
  const serviceTable = await awaitElementById('status-history-service-list-table')
  const initial: AWSHealthServiceMap = 1 < pageNo
    ? (getPaginatedAggregation() ?? {})
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
    storePaginatedAggregation(result)
  } else {
    deletePaginatedAggregation()
  }
  return result
}

export const AWSHealthStatus: Userscript = {
  name: "AWSHealthStatus",

  isSupported: (href: string): boolean =>
    href.startsWith(AWSHealthStatusPage),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    await awaitDelay(500)
    let hasNextPage = true
    let currentPageNo = 0
    while (hasNextPage) {
      const lastPageNo = currentPageNo
      const pages = Array.from(document.querySelector('ul[aria-label="Table pagination"]').querySelectorAll('button'))
      currentPageNo = parseInt(pages.filter(button => button.ariaCurrent === 'true')[0].innerText)
      if (currentPageNo === lastPageNo) {
        await awaitDelay(25)
        continue
      }
      const nextPage = pages.slice(-1)[0]
      hasNextPage = !nextPage.disabled
      const serviceStatusMap = await scrapeServiceStatusMap(currentPageNo, hasNextPage)
      if (nextPage.disabled) {
        const eventState = document.querySelector('div[class*="event-state"]') as HTMLElement
        const overallStatus = eventState.innerText.split('\n')
        const statusText = getMaxOccurringValidStatus([overallStatus[0].trim()])
        const timestamp = parseDateTime(overallStatus[1]) ?? new Date()
        const services = Object.keys(serviceStatusMap)
        const result: { status: Status, incidents: Incident[] } = {
          status: {
            timestamp: timestamp.getTime(),
            description: statusText,
            indicator: getMaxOccurringValidStatus([(eventState.firstElementChild as HTMLElement).dataset.analytics])
          },
          incidents: services.map(serviceName => {
            const updates = serviceStatusMap[serviceName].map(regions => {
              return {
                name: regions.region,
                status: regions.status,
                updated: timestamp.getTime()
              } as IncidentUpdate
            })
            const status = getMaxOccurringValidStatus(updates.map(({ status }) => status))
            return {
              timestamp: timestamp.getTime(),
              name: serviceName,
              updated: timestamp.getTime(),

              updates,
              status,
              impact: status === NoStatusStatus ? 'none' : status

            } as Incident
          }),
        }
        storeAWSStatus(result)
        break
      } else {
        nextPage.click()
      }
    }
  },
};
