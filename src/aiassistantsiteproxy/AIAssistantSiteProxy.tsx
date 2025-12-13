import React from "react";
import "../common/ui/styles.css";
import { Userscript, RunUserscripts } from "../common/userscript";
import { AIAssistantSiteAgentProxy } from "./AIAssistantSiteAgentProxy/AIAssistantSiteAgentProxy";
import { AIAssistantSiteAgent } from "./AIAssistantSiteAgent/AIAssistantSiteAgent";

const aiAssistantUserscripts: Userscript[] = [
  AIAssistantSiteAgentProxy,
  AIAssistantSiteAgent
];
RunUserscripts(aiAssistantUserscripts)