import { JobSite } from "../jobsite";
import {
  awaitPageLoadByEvent,
  awaitQuerySelection,
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";

export const BuiltInBoston: JobSite = {
  name: "Built-In-Boston",
  siteUrls: ["https://www.builtinboston.com/#application-tracker-section"],
  jobUrl: ".builtinboston.com/job/",
  isJobSite: (href: string) => href.includes(BuiltInBoston.jobUrl as string),
  awaitPageLoad: () => awaitPageLoadByEvent(),
  addRenderable: async (renderable: HTMLElement) => {
    const parent = (await awaitQuerySelection("h1")).parentElement!;
    parent.appendChild(renderable);
  },
  removeRenderable: async (renderable: HTMLElement) => {
    if (renderable.parentElement) {
      renderable.parentElement.removeChild(renderable);
    }
  },
  scrapeJob: async (href: string): Promise<Partial<JobApplication> | null> => {
    const result: Partial<JobApplication> = {
      jobDescriptionUrl: href,
    };
    const topCardLines = document
      .getElementById("main")
      ?.innerText.split("\n")
      .map((text) => text.trim())
      .filter((text) => 0 != text.length);
    if (topCardLines) {
      const saveButtonIndex = topCardLines.findIndex((text) =>
        text.startsWith("[JobSaver:"),
      );

      const indices = {
        company: 0,
        title: 1,
        dates: 2,
        location: saveButtonIndex + 1,
      };
      result.company = topCardLines[indices.company];
      result.position = topCardLines[indices.title];
      result.location = topCardLines[indices.location];
    }
    return result;
  },
};
