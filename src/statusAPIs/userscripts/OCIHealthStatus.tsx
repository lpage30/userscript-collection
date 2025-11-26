// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://ocistatus.oraclecloud.com/
import React from "react";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitDelay,
  awaitQuerySelection
} from "../../common/await_functions";
import { Status, Incident, IncidentUpdate } from "../statustypes";
import { storeOCIStatus, OCIHealthStatusPage } from "../services/oci";
import { getMaxOccurringValidStatus, NoStatusStatus } from "../conversionfunctions";

type OCIHealthPageServiceRegion = { service: string, region: string, status: string }
type OCIHealthServiceMap = { [service: string]: OCIHealthPageServiceRegion[] }

const getPageInfo = async (): Promise<{ pages: HTMLElement[], currentPage: number, nextPage: number }> => {
  const pageList = await awaitQuerySelection('ul')
  const pages = Array.from(pageList.querySelectorAll('li'))
  const currentPage = pages.findIndex(page => Array.from(page.classList).includes('active'))
  const nextPage = (currentPage + 1) < pages.length ? currentPage + 1 : -1
  return {
    pages,
    currentPage,
    nextPage
  }
}
const getDataTableHeaders = (dataTable: HTMLElement) => Array.from(dataTable.children[0].children[0].children)
  .map(th => (th as HTMLElement).innerText)
const getDataTableDataRows = (dataTable: HTMLElement, columnLength: number) => Array.from(dataTable.children[1].children)
  .map(tr => Array.from(tr.children))
  .filter(arr => arr.length === columnLength)
  .map(tr => tr
    .map((td, index) => 0 === index
      ? (td as HTMLElement).innerText
      : td.querySelector('img').alt.trim()
    )
  )
async function scrapeOCIHealthServiceMap(initialMap: OCIHealthServiceMap): Promise<OCIHealthServiceMap> {
  const dataTable = await awaitQuerySelection('table')
  const columnHeaders = getDataTableHeaders(dataTable)
  const dataRows = getDataTableDataRows(dataTable, columnHeaders.length)
  return dataRows.reduce((result, dataRow) => {
    const serviceName = dataRow[0]
    const regionStatuses = dataRow.slice(1).map((status, index) => ({ service: serviceName, region: columnHeaders[1 + index], status } as OCIHealthPageServiceRegion))
    return {
      ...result,
      [serviceName]: [...(result[serviceName] ?? []), ...regionStatuses]
    }
  }, initialMap)
}

const paginationAggregationVariableName = 'oci_paginated_status_aggregation'
function deletePaginatedAggregation() {
  GM_deleteValue(paginationAggregationVariableName)
}
function getPaginatedAggregation(): OCIHealthServiceMap | null {
  const result = GM_getValue(paginationAggregationVariableName)
  return result ? JSON.parse(result) : null
}
function storePaginatedAggregation(aggregate: OCIHealthServiceMap) {
  GM_setValue(paginationAggregationVariableName, JSON.stringify(aggregate))
}


async function scrapeServiceStatusMap(pageNo: number, hasNextPage: boolean): Promise<OCIHealthServiceMap> {
  const initial: OCIHealthServiceMap = 0 < pageNo
    ? (getPaginatedAggregation() ?? {})
    : {}
  console.log(`Page ${pageNo}, More Pages: ${hasNextPage}`)
  const result = await scrapeOCIHealthServiceMap(initial)

  if (hasNextPage) {
    storePaginatedAggregation(result)
  } else {
    deletePaginatedAggregation()
  }
  return result
}


export const OCIHealthStatus: Userscript = {
  name: "OCIHealthStatus",

  isSupported: (href: string): boolean =>
    href.startsWith(OCIHealthStatusPage),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByEvent();
    await awaitDelay(500)
    let hasNextPage = true
    let currentPageNo = -1
    while (hasNextPage) {
      const lastPageNo = currentPageNo
      const { pages, currentPage, nextPage } = await getPageInfo()
      currentPageNo = currentPage
      if (currentPageNo === lastPageNo) {
        await awaitDelay(25)
        continue
      }
      hasNextPage = 0 <= nextPage
      const serviceStatusMap = await scrapeServiceStatusMap(currentPageNo, hasNextPage)
      if (!hasNextPage) {
        const timestamp = Date.now()
        const services = Object.keys(serviceStatusMap)
        const status = getMaxOccurringValidStatus(Object.values(serviceStatusMap).map(serviceRegionStatues => serviceRegionStatues.map(({ status }) => status)).flat())
        const result: { status: Status, incidents: Incident[] } = {
          status: {
            timestamp,
            description: status,
            indicator: status,
          },
          incidents: services.map(serviceName => {
            const updates = serviceStatusMap[serviceName].map(regions => {
              return {
                name: regions.region,
                status,
                updated: timestamp
              } as IncidentUpdate
            })
            const serviceStatus = getMaxOccurringValidStatus(updates.map(({ status }) => status))
            return {
              timestamp: timestamp,
              name: serviceName,
              updated: timestamp,
              updates,
              status: serviceStatus,
              impact: serviceStatus === NoStatusStatus ? 'none' : serviceStatus,

            } as Incident
          }),
        }
        storeOCIStatus(result)
        break
      } else {
        pages[nextPage].click()
      }
    }
  },
};
