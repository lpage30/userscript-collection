import { awaitQuerySelection } from "../../../common/await_functions";
import { AISite } from "../aisite";
import { ChatRequest, ChatResponse } from "../../AIClient";
import { awaitForItem } from "../../../common/functions";

export const GoogleGemini: AISite = {
  name: "GoogleGemini",
  siteUrls: ["https://gemini.google.com"],
  botUrl: "gemini.google.com",
  isAISite: (href: string) => href.includes(GoogleGemini.botUrl as string),
  awaitPageLoad: async (): Promise<void> => {
    await awaitQuerySelection("rich-textarea");
  },
  addRenderable: async (renderable: HTMLElement): Promise<void> => {
    const parent = (await awaitQuerySelection("input-area-v2")).parentElement;
    parent?.appendChild(renderable);
  },
  removeRenderable: async (renderable: HTMLElement): Promise<void> => {
    if (renderable.parentElement) {
      renderable.parentElement.removeChild(renderable);
    }
  },
  ask: async (request: ChatRequest): Promise<ChatResponse> => {
    const prompt = (await awaitQuerySelection("rich-textarea"))
      .firstElementChild as HTMLElement;
    prompt.innerText = "";

    prompt.innerText = request.message;
    await awaitForItem<boolean>(() => {
      const button = document.querySelector(
        'button[class*="send-button"]',
      ) as HTMLButtonElement;
      return button && button.ariaDisabled !== "true";
    }, "Failed waiting for Submit Button to Enable");

    const submitButton = await awaitQuerySelection(
      'button[class*="send-button"]',
    );
    submitButton.click();

    await awaitForItem<boolean>(
      () => {
        const interruptButton = document.querySelector(
          '[class*="blue-circle stop-icon"]',
        );
        return null == interruptButton;
      },
      "Failed waiting for interrupt button to go away",
      { maxRetries: 150, intervalMs: 2000 },
    );

    const assistantMessage = [
      ...(Array.from(
        document.querySelectorAll("message-content"),
      ) as HTMLElement[]),
    ].slice(-1)[0];

    return {
      chatId: request.chatId,
      clientName: GoogleGemini.name,
      datetime: new Date().toISOString(),
      request,
      responses: [assistantMessage ? assistantMessage.innerText.trim() : ""],
    };
  },
};
