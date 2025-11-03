import { ChatRequest, ChatResponse } from "../AIClient";
import { Site } from "../../common/site";
export interface AISite extends Site {
  botUrl: string;
  isAISite: (href: string) => boolean;
  awaitPageLoad: () => Promise<void>;
  addRenderable: (renderable: HTMLElement) => Promise<void>;
  removeRenderable: (renderable: HTMLElement) => Promise<void>;
  ask: (request: ChatRequest) => Promise<ChatResponse>;
}
