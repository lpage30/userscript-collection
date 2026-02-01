// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://geoblackout.com/us/report/internet/*
import React from "react";
import { Userscript } from "../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitQueryAll,
} from "../common/await_functions";
import { parseNumber } from "../common/functions";
import {
  OutageBreakdown,
  OutageBreakdownData,
  ReferenceTimelineLineData,
  ReportedTimelineGraphData,
  ReportedTimelineGraph
} from "./outageBreakdownAPItypes";
import { reportServiceOutage } from "./outageAggregator";

export const serviceOutage: Userscript = {
  name: "GeoblackoutServiceOutage",
  containerId: 'service-outage',
  isSupported: (href: string): boolean => {
    const parts = href.split('/')
    return href.startsWith('https://geoblackout.com/us/report/internet/') &&
      7 === parts.length && 0 < parts.slice(-1)[0].length &&
      !['&', '?', '='].some(c => parts.slice(-1)[0].includes(c))
  },
  preparePage: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    await awaitQueryAll('canvas')
  },
  cleanupContainers: async (href: string): Promise<boolean> => false,
  createContainer: async (href: string): Promise<HTMLElement> => null,
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const serviceName: string = href.split('/').slice(-1)[0]
    const outageData: OutageBreakdownData[] = Array.from(document.querySelectorAll('div[class*="ReportStats"]'))
      .filter(e => e.className.toLowerCase().endsWith('subcategory'))
      .map((e: HTMLElement): OutageBreakdownData => {
        const parts = e.innerText.split('\n').map(t => t.trim()).filter(t => 0 < t.length)
        return {
          percentage: parseNumber(parts[0]),
          type: parts[1],
          alertCount: parseNumber(parts[2])
        }
      })

    const graphData: ReportedTimelineGraph = Object.entries(document.querySelector('canvas'))
      .filter(([key]) => key.startsWith('__reactFiber'))[0][1].return.memoizedProps.data.datasets
      .map((obj: any): ReferenceTimelineLineData | ReportedTimelineGraphData => {
        const newObj = JSON.parse(JSON.stringify(({ ...obj, ...(obj.label === 'Référence' ? { label: 'Reference' } : {}) })))
        switch (newObj.label) {
          case 'Reference': return newObj as ReferenceTimelineLineData
          case 'Reports': return newObj as ReportedTimelineGraphData
          default: throw new Error(`Unsupported Graph type: ${obj.label} ${JSON.stringify(obj)}`)
        }
      })

    const serviceBlurb = Array.from(
      Array.from(document.querySelectorAll('div[class*="ReportPage"]'))
        .filter(e => e.className.endsWith('content'))[0]
        .querySelector('div[class*="caption"]')
        .querySelectorAll('p')
    ).slice(-2)
      .map(e => e.innerText)
      .join('\n')

    reportServiceOutage({
      timestamp: Date.now(),
      service: serviceName,
      serviceHref: href,
      blurb: serviceBlurb,
      graphData,
      data: outageData
    } as OutageBreakdown)

  },
};
