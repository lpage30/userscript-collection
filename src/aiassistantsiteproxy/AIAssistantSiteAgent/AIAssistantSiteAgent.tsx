import React from "react";
import "../../common/ui/styles.css";
import { Userscript } from "../../common/userscript";
import { getSite } from "./sites/sites";
import { BlinkingRedText } from "../../common/ui/blinking_red_text";
import { reactToHTMLString } from "../../common/ui/reactTrustedHtmlString";
import { SiteAgent } from "./siteagent";
import { AIAssistantSiteProxyConfig } from "../aiassistantsiteproxy.config";

const siteAgent = new SiteAgent(AIAssistantSiteProxyConfig);
const renderableId = "ai-assistant-site-notice";
export const AIAssistantSiteAgent: Userscript = {
  name: "AIAssistantSiteAgent",

  isSupported: (href: string): boolean => null != getSite(href),

  render: async (href: string): Promise<void> => {
    const aiSite = getSite(href);
    if (aiSite == undefined) {
      throw new Error(`${href} has no supported ai assistant Userscript`);
    }
    await aiSite.awaitPageLoad();
    siteAgent.start(aiSite);
    const text = `***In Use by AI Assistant Site Agent ***`;
    const renderable = document.createElement("div");
    renderable.id = renderableId;
    renderable.innerHTML = reactToHTMLString(<BlinkingRedText text={text} />);
    await aiSite.addRenderable(renderable);
  },
};
