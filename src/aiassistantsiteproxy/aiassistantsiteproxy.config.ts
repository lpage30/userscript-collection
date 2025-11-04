import { WebserverUrlBase } from "../webserver.config";

export const AIAssistantSiteProxyConfig = {
  proxyWebserverUrlBase: WebserverUrlBase,
  proxyDashboardPage: 'ai-assistant-proxy-dashboard.html',
  keepAliveIntervalms: 15000,
  keepAliveExpiredms: 30000,
};

