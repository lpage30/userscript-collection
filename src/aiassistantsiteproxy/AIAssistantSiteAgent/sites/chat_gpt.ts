import { awaitElementById } from "../../../common/await_functions";
import { awaitForItem } from "../../../common/functions";
import { dispatchInput } from "../../../common/input_functions";
import { AISite } from "../aisite";
import { ChatRequest, ChatResponse } from "../../AIClient";

export const ChatGPT: AISite = {
  name: "ChatGPT",
  siteUrls: ["https://chatgpt.com"],
  botUrl: "chatgpt.com",
  isAISite: (href: string) => href.includes(ChatGPT.botUrl as string),
  awaitPageLoad: async (): Promise<void> => {
    await awaitElementById("prompt-textarea");
  },
  addRenderable: async (renderable: HTMLElement): Promise<void> => {
    const parent = await awaitElementById("thread-bottom");
    parent.appendChild(renderable);
  },
  removeRenderable: async (renderable: HTMLElement): Promise<void> => {
    if (renderable.parentElement) {
      renderable.parentElement.removeChild(renderable);
    }
  },
  ask: async (request: ChatRequest): Promise<ChatResponse> => {
    const prompt = await awaitElementById("prompt-textarea");
    dispatchInput("", prompt);

    dispatchInput(request.message, prompt);
    await awaitForItem<boolean>(() => {
      const button = document.getElementById(
        "composer-submit-button",
      ) as HTMLButtonElement;
      return button && !button.disabled;
    }, "Failed waiting for Submit Button to Enable");

    const submitButton = await awaitElementById("composer-submit-button");
    submitButton.click();
    await awaitForItem<boolean>(
      () => {
        const button = document.getElementById(
          "composer-submit-button",
        ) as HTMLButtonElement;
        return button == null || button.disabled;
      },
      "Failed waiting for Submit Button to disable/go-away",
      { maxRetries: 150, intervalMs: 2000 },
    );

    const assistantMessage: HTMLElement = [
      ...(Array.from(
        document.querySelectorAll('[data-message-author-role="assistant"]'),
      ) as HTMLElement[]),
    ].slice(-1)[0];

    return {
      chatId: request.chatId,
      clientName: ChatGPT.name,
      datetime: new Date().toISOString(),
      request,
      responses: [assistantMessage ? assistantMessage.innerText.trim() : ""],
    };
  },
};
