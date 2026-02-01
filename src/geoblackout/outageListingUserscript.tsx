// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @include     https://geoblackout.com/us/report/internet/
import React from "react";
import { Userscript } from "../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitQueryAll,
} from "../common/await_functions";
import { reportOutageListing } from "./outageAggregator";

export const outageListing: Userscript = {
  name: "GeoblackoutOutageListing",
  containerId: 'outage-listing',
  isSupported: (href: string): boolean => {
    const parts = href.split('/')
    return href.startsWith('https://geoblackout.com/us/report/internet') &&
      (6 === parts.length || (7 == parts.length && 0 === parts.slice(-1)[0].length))
  },
  preparePage: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    await awaitQueryAll('a')
    await awaitQueryAll('canvas')
  },
  cleanupContainers: async (href: string): Promise<boolean> => false,
  createContainer: async (href: string): Promise<HTMLElement> => null,
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const outageListing: string[] = Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(h => h.startsWith('https://geoblackout.com/us/report/internet/'))
    reportOutageListing(outageListing)
  },
};
