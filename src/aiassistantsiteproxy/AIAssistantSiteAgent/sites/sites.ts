import { ChatGPT } from "./chat_gpt";
import { GoogleGemini } from "./google_gemini";
import { MicrosoftCopilot } from "./microsoft_copilot";
import { AISite } from "../aisite";

export const AISites: AISite[] = [ChatGPT, GoogleGemini, MicrosoftCopilot];
export function getSite(href: string): AISite | null {
  return AISites.find((site) => site.isAISite(href)) ?? null;
}

const aiSiteNames = [
  ChatGPT.name,
  GoogleGemini.name,
  MicrosoftCopilot.name,
] as const;

export type AISiteType = (typeof aiSiteNames)[number];
export const AISiteTypeArray: AISiteType[] = aiSiteNames.map(
  (name) => name as AISiteType,
);

export function getAISiteType(href: string): AISiteType | null {
  const siteIndex = AISites.findIndex((aiSite) => aiSite.isAISite(href));
  return 0 <= siteIndex ? (AISites[siteIndex].name as AISiteType) : null;
}
