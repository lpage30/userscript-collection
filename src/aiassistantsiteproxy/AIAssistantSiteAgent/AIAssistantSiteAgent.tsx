import React from "react";
import "../../common/ui/styles.scss";
import { Userscript } from "../../common/userscript";
import { getSite } from "./sites/sites";
import { BlinkingRedText } from "../../common/ui/blinking_red_text";
import { reactToHTMLString } from "../../common/ui/reactTrustedHtmlString";
import { SiteAgent } from "./siteagent";
import { AIAssistantSiteProxyConfig } from "../aiassistantsiteproxy.config";

const siteAgent = new SiteAgent(AIAssistantSiteProxyConfig);
export const AIAssistantSiteAgent: Userscript = {
  name: "AIAssistantSiteAgent",
  containerId: "ai-assistant-site-notice",

  isSupported: (href: string): boolean => null != getSite(href),

  preparePage: async (href: string): Promise<void> => {
    const aiSite = getSite(href);
    if (aiSite == undefined) {
      throw new Error(`${href} has no supported ai assistant Userscript`);
    }
    await aiSite.awaitPageLoad();
  },
  cleanupContainers: async (href: string): Promise<boolean> => false,
  createContainer: async (href: string): Promise<HTMLElement> => null,
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const aiSite = getSite(href);
    siteAgent.start(aiSite);
    const text = `***In Use by AI Assistant Site Agent ***`;
    const renderable = document.createElement("div");
    renderable.id = AIAssistantSiteAgent.containerId;
    renderable.innerHTML = reactToHTMLString(<BlinkingRedText text={text} />);
    await aiSite.addRenderable(renderable);
  },
};
