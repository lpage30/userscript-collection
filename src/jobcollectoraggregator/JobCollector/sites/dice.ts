import { JobSite } from "../jobsite";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";

export const Dice: JobSite = {
  name: "Dice",
  siteUrls: ["https://www.dice.com/my-jobs"],
  jobUrl: ".dice.com/job-detail",
  isJobSite: (href: string) => href.includes(Dice.jobUrl as string),
  awaitPageLoad: () => awaitPageLoadByMutation(),
  addRenderable: async (renderable: HTMLElement) => {
    const parent = await awaitElementById("buttonsDiv");
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
    const details = document
      .getElementById("jobdetails")
      ?.innerText.split("\n");
    if (details) {
      result.position = details[0];
      result.company = details[1];
      if (!details[2].includes("|")) {
        result.location = details[2];
      } else {
        result.location =
          document
            .querySelector("article")
            ?.innerText.split("\n")
            .map((text) => text.trim())
            .filter((text) => 0 < text.length)[1] ?? "";
      }
    }
    return result;
  },
};
