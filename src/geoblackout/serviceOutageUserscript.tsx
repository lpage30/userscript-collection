// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://geoblackout.com/us/report/internet/*
import React from "react";
import { Userscript } from "../common/userscript";
import {
  awaitPageLoadByMutation,
} from "../common/await_functions";
import { parseNumber } from "../common/functions";
import { OutageBreakdownData } from "./outageBreakdownAPItypes";
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
  },
  cleanupContainers: async (href: string): Promise<boolean> => false,
  createContainer: async (href: string): Promise<HTMLElement> => null,
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const serviceName: string = href.split('/').slice(-1)[0]
    const outageData: OutageBreakdownData[] = Array.from(document.querySelectorAll('div[class*="ReportStats_subCategory"]'))
      .map((e: HTMLElement): OutageBreakdownData => {
        const parts = e.innerText.split('\n').map(t => t.trim()).filter(t => 0 < t.length)
        return {
          percentage: parseNumber(parts[0]),
          type: parts[1],
          alertCount: parseNumber(parts[2])
        }
      })
    reportServiceOutage({
      timestamp: Date.now(),
      service: serviceName,
      data: outageData
    })

  },
};
