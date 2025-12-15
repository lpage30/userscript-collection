import React from "react";
import "../../common/ui/styles.scss";
import { Userscript } from "../../common/userscript";
import { ChatResponse, ChatRequest } from "../AIClient";
import { BlinkingRedText } from "../../common/ui/blinking_red_text";
import { reactToHTMLString } from "../../common/ui/reactTrustedHtmlString";
import {
  processChatRequests,
  processChatResponses,
} from "./AIClientRequestResponse";
import { SiteAgentProxy } from "./siteagentproxy";
import { AIAssistantSiteProxyConfig } from "../aiassistantsiteproxy.config";
import {
  awaitDelay,
  awaitPageLoadByEvent,
  awaitElementById,
} from "../../common/await_functions";
import { ONE_DAY } from "../../common/datetime";
import { AIAssistantProxyDashboardPageUrl } from "../ai_service_types";
import { AIRequestStatusReport, AIResponseStatusReport, AIStatusReport } from "../ai_service_types";
import { AISiteTypeArray } from "../AIAssistantSiteAgent/sites/sites";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import AIAssistantProxyDashboard from "./AIAssistantProxyDashboard";
import { toString } from "../../common/functions";

const fetchPostIntervalms = 10000;
const siteAgentProxy = new SiteAgentProxy(AIAssistantSiteProxyConfig);

let responses: ChatResponse[] = [];
const emptyAIStatusReport: Partial<AIStatusReport> = {
  totalRequests: 0,
  totalResponses: 0,
  oldest: new Date(Date.now() + ONE_DAY),
  newest: new Date(0),
}
let requestResponseReport: { [site: string]: AIStatusReport } = AISiteTypeArray.reduce((report, site) => ({
  ...report,
  [site]: { ...emptyAIStatusReport, site }
}), {})

const updateResponseReport = (responses: { [site: string]: AIResponseStatusReport }) => {
  requestResponseReport = Object.keys(responses).reduce((newReport, site) => {
    const newRecord = { ...(newReport[site] ?? { ...emptyAIStatusReport, site }) }
    newRecord.totalResponses += responses[site].totalResponses
    newRecord.oldest = responses[site].timestamp < newRecord.oldest.getTime()
      ? new Date(responses[site].timestamp)
      : newRecord.oldest
    newRecord.newest = responses[site].timestamp > newRecord.newest.getTime()
      ? new Date(responses[site].timestamp)
      : newRecord.newest
    return {
      ...newReport,
      [site]: newRecord as AIStatusReport
    }

  }, { ...requestResponseReport })
}
const updateRequestReport = (requests: { [site: string]: AIRequestStatusReport }) => {
  requestResponseReport = Object.keys(requests).reduce((newReport, site) => {
    const newRecord = { ...(newReport[site] ?? { ...emptyAIStatusReport, site }) }
    newRecord.totalRequests += responses[site].totalRequests
    newRecord.oldest = responses[site].timestamp < newRecord.oldest.getTime()
      ? new Date(responses[site].timestamp)
      : newRecord.oldest
    newRecord.newest = responses[site].timestamp > newRecord.newest.getTime()
      ? new Date(responses[site].timestamp)
      : newRecord.newest
    return {
      ...newReport,
      [site]: newRecord as AIStatusReport
    }

  }, { ...requestResponseReport })

}


async function runProcesses(updateDashboard: (report: { [site: string]: AIStatusReport }) => void | null) {

  siteAgentProxy.start((response) => {
    if ((response as any).error) {
      console.error(`Response Failure: ${(response as any).error}`);
    } else {
      responses.push(response as ChatResponse);
    }
  });

  const timer1 = setInterval(async () => {
    await processChatRequests(
      () => siteAgentProxy.getConnectedSites(),
      async (request: ChatRequest) => {
        await siteAgentProxy.ask(request);
      },
      updateRequestReport
    );
    if (updateDashboard) updateDashboard(requestResponseReport)
  }, fetchPostIntervalms);

  await awaitDelay(fetchPostIntervalms);

  const timer2 = setInterval(async () => {
    await processChatResponses(() => {
      const newResponses = responses;
      responses = [];
      return newResponses;
    },
      updateResponseReport);
    if (updateDashboard) updateDashboard(requestResponseReport)
  }, fetchPostIntervalms);

  return () => {
    clearInterval(timer1);
    clearInterval(timer2);
    siteAgentProxy.stop();
  };
}
export const AIAssistantSiteAgentProxy: Userscript = {
  name: "AIAssistantSiteAgentProxy",
  containerId: 'ai-dashboard',

  isSupported: (href: string): boolean =>
    href.includes(AIAssistantProxyDashboardPageUrl),

  preparePage: async (href: string): Promise<void> => {
    if (!href.includes(AIAssistantProxyDashboardPageUrl)) {
      throw new Error(`${href} has no supported AIAssistantClient Userscript`);
    }
    await awaitPageLoadByEvent();

  },
  createContainer: async (href: string): Promise<HTMLElement> => {
    const hrefParams = new URLSearchParams((new URL(href)).search.toLowerCase())
    const headless = ['true', ''].includes(hrefParams.get('headless'))

    return !headless ? createRenderableContainerAsChild(
      document.body,
      AIAssistantSiteAgentProxy.containerId,
    ) : null
  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    let updateDashboard: (report: { [site: string]: AIStatusReport }) => void | null = null
    let stop: () => void | null = null
    try {
      const hrefParams = new URLSearchParams((new URL(href)).search.toLowerCase())
      const headless = ['true', ''].includes(hrefParams.get('headless'))
      if (!headless) {
        renderInContainer(container, <AIAssistantProxyDashboard
          initialReport={requestResponseReport}
          registerAIStatusReportChange={(update) => { updateDashboard = update }}
        />);
        await awaitElementById(container.id);
      }
      stop = await runProcesses(updateDashboard);
    } catch (e) {
      console.error(`Failed running AIDashboard ${toString(e)}`, e)
      if (stop) stop()
    }
  },
};
