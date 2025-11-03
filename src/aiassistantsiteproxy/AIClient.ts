export interface AIClient {
  clientId: string;
  name: string;
  openChat: (history?: ChatHistoryContent[]) => Promise<Chat>;
}

export interface ChatRequest {
  chatId: string;
  requestId: number;
  message: string;
}
export interface ChatResponse {
  chatId: string;
  clientName: string;
  datetime: string;
  request: ChatRequest;
  responses: (ChatResponse | string)[];
}

export type ChatHistoryContent = ChatResponse;

export interface Chat {
  chatId: string;
  client: AIClient;
  ask: (request: ChatRequest) => Promise<ChatResponse>;
  getHistory: () => Promise<ChatHistoryContent[]>;
}

export type MessageType = "user" | "assistant";
interface MessageBase<T = MessageType> {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
  type: T;
}
export interface UserMessage extends MessageBase<"user"> {
  content: string;
}
export interface AssistantMessage extends MessageBase<"assistant"> {
  content: {
    [key: string]: string[];
  } /* response.responses.clientName => response.responses as string[]*/;
}
export type Message = UserMessage | AssistantMessage;

export function toAssistantMessageContent(
  responses: (ChatResponse | string)[],
): { [key: string]: string[] } {
  return responses.reduce((result: { [key: string]: string[] }, response) => {
    if (typeof response === "string") {
      if (!result["0"]) {
        result["0"] = [];
      }
      result["0"].push(response);
    } else {
      if (!result[response.clientName]) {
        result[response.clientName] = [];
      }
      result[response.clientName].push(...(response.responses as string[]));
    }
    return result;
  }, {});
}
