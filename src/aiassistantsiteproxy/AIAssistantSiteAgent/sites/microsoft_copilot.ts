import {
  awaitElementById,
  awaitQuerySelection,
} from "../../../common/await_functions";
import { AISite } from "../aisite";
import { ChatRequest, ChatResponse } from "../../AIClient";
import { dispatchInput } from "../../../common/input_functions";
import { awaitForItem } from "../../../common/functions";

export const MicrosoftCopilot: AISite = {
  name: "MicrosoftCopilot",
  siteUrls: ["https://copilot.microsoft.com"],
  botUrl: "copilot.microsoft.com",
  isAISite: (href: string) => href.includes(MicrosoftCopilot.botUrl as string),
  awaitPageLoad: async (): Promise<void> => {
    await awaitElementById("userInput");
  },
  addRenderable: async (renderable: HTMLElement): Promise<void> => {
    let parent = (await awaitQuerySelection('button[aria-label="Go to home"]'))
      ?.parentElement;
    parent = parent?.nextElementSibling as HTMLElement | null;
    parent?.appendChild(renderable);
  },
  removeRenderable: async (renderable: HTMLElement): Promise<void> => {
    if (renderable.parentElement) {
      renderable.parentElement.removeChild(renderable);
    }
  },
  ask: async (request: ChatRequest): Promise<ChatResponse> => {
    const prompt = await awaitElementById("userInput");
    dispatchInput("", prompt);

    dispatchInput(request.message, prompt);
    await awaitForItem<boolean>(() => {
      const submitButton = document.querySelector(
        'button[aria-label="Submit message"]',
      );
      return null !== submitButton;
    }, "Failed waiting for Submit Button to Enable");

    const submitButton = await awaitQuerySelection(
      'button[aria-label="Submit message"]',
    );
    submitButton.click();
    await awaitForItem<boolean>(
      () => {
        const interruptButton = document.querySelector(
          'button[aria-label="Interrupt message"]',
        );
        const submitButton = document.querySelector(
          'button[aria-label="Submit message"]',
        );
        return interruptButton === null && submitButton === null;
      },
      "Failed waiting for interrupt and submit buttons to go away",
      { maxRetries: 150, intervalMs: 2000 },
    );

    const assistantMessage = [
      ...(Array.from(
        document.querySelectorAll('div[data-content="ai-message"]'),
      ) as HTMLElement[]),
    ].slice(-1)[0];

    return {
      chatId: request.chatId,
      clientName: MicrosoftCopilot.name,
      datetime: new Date().toISOString(),
      request,
      responses: [assistantMessage ? assistantMessage.innerText.trim() : ""],
    };
  },
};
