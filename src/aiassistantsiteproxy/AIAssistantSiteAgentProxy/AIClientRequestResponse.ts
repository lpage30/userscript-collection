import { ApiResponse } from "../../common/service_types";
import {
  FetchRequestsRestUrl,
  PostResponsesRestUrl,
} from "../ai_service_types";
import { ChatRequest, ChatResponse } from "../AIClient";
import { ConnectedSite } from "./siteagentproxy";
let lastConnectTime = 0;

export async function fetchChatRequests(
  getConnectedSites: () => ConnectedSite[],
): Promise<ChatRequest[]> {
  return new Promise<ChatRequest[]>((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "POST",
      url: `${FetchRequestsRestUrl}/${lastConnectTime}`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ connectedSites: getConnectedSites() }),
      onload: (response: GM_xmlhttpRequestResponse) => {
        lastConnectTime = Date.now();
        const result: ApiResponse<ChatRequest[]> = JSON.parse(
          response.responseText,
        );
        resolve(result.data!);
      },
      onerror: (response) => {
        lastConnectTime = Date.now();
        reject(new Error(response.statusText));
      },
    });
  });
}

export async function postChatResponses(responses: ChatResponse[]) {
  await new Promise<void>((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "POST",
      url: PostResponsesRestUrl,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ responses }),
      onload: (response: GM_xmlhttpRequestResponse) => {
        resolve();
      },
      onerror: (response) => reject(new Error(response.statusText)),
    });
  });
}

export async function processChatResponses(getResponses: () => ChatResponse[]) {
  await postChatResponses(getResponses());
}
export async function processChatRequests(
  getConnectedSites: () => ConnectedSite[],
  ask: (request: ChatRequest) => Promise<void>,
) {
  const requests = await fetchChatRequests(getConnectedSites);
  for (const request of requests) {
    await ask(request);
  }
}
