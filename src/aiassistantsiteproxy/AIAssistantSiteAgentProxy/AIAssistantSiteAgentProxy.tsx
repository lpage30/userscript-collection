import React from "react";
import "../../common/ui/styles.css";
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
import { AIAssistantProxyPageUrl } from "../ai_service_types";

const fetchPostIntervalms = 10000;
const siteAgentProxy = new SiteAgentProxy(AIAssistantSiteProxyConfig);

let responses: ChatResponse[] = [];

async function runProcesses() {
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
    );
  }, fetchPostIntervalms);

  await awaitDelay(fetchPostIntervalms);

  const timer2 = setInterval(async () => {
    await processChatResponses(() => {
      const newResponses = responses;
      responses = [];
      return newResponses;
    });
  }, fetchPostIntervalms);
  return () => {
    clearInterval(timer1);
    clearInterval(timer2);
    siteAgentProxy.stop();
  };
}
const renderableId = "ai-assistance-proxy-notice";
export const AIAssistantSiteAgentProxy: Userscript = {
  name: "AIAssistantSiteAgentProxy",

  isSupported: (href: string): boolean =>
    href.includes(AIAssistantProxyPageUrl),

  render: async (href: string): Promise<void> => {
    if (!href.includes(AIAssistantProxyPageUrl)) {
      throw new Error(`${href} has no supported AIAssistantClient Userscript`);
    }
    await awaitPageLoadByEvent();
    const text = `***In Use by AI Assistant SiteAgent Proxy ***`;
    const renderable = document.createElement("div");
    renderable.id = renderableId;
    renderable.innerHTML = reactToHTMLString(<BlinkingRedText text={text} />);
    const parent = await awaitElementById("ai-assistant-proxy");
    parent.appendChild(renderable);

    await runProcesses();
  },
};
