import { AIAssistantSiteProxyConfig } from "./aiassistantsiteproxy.config";
import { AISiteType } from "./AIAssistantSiteAgent/sites/sites";
export const FetchRequestsRestUrl = `${AIAssistantSiteProxyConfig.proxyWebserverUrlBase}/api/ai/userscript/chat/requests`;
export const PostResponsesRestUrl = `${AIAssistantSiteProxyConfig.proxyWebserverUrlBase}/api/ai/userscript/chat/responses`;
export const AIAssistantProxyDashboardPageUrl = `${AIAssistantSiteProxyConfig.proxyWebserverUrlBase}/${AIAssistantSiteProxyConfig.proxyDashboardPage}`;

export interface AIRequestStatusReport {
    site: AISiteType
    totalRequests: number
    timestamp: number
}
export interface AIResponseStatusReport {
    site: AISiteType
    totalResponses: number
    timestamp: number
}
export interface AIStatusReport {
    site: AISiteType
    totalRequests: number
    totalResponses: number
    oldest: Date
    newest: Date
}
export function isDifferentAIStatusReport(left: { [site: string]: AIStatusReport}, right: { [site: string]: AIStatusReport}): boolean {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)
    if (leftKeys.length !== rightKeys.length) return true
    if (!leftKeys.every(key => rightKeys.includes(key))) return true
    return !leftKeys.every(key => 
        left[key].totalRequests === right[key].totalRequests &&
        left[key].totalResponses === right[key].totalResponses &&
        left[key].oldest === right[key].oldest &&
        left[key].newest=== right[key].newest
    )
}