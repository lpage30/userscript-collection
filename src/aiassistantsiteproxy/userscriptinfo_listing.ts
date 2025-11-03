import { UserscriptInfoListing } from "../common/userscript.ts";

export const UserscriptListing: UserscriptInfoListing = Object.freeze({
  AiAssistantSiteProxy: {
    name: "AIAssistantSiteProxyUserscript",
    filename: "ai-assistant-site-proxy.user.js",
    headerFilepath: "src/aiassistantsiteproxy/userscript-header.ts",
    entryFilepath: "src/aiassistantsiteproxy/AIAssistantSiteProxy.tsx",
  },
});
