import { JobSite } from "../jobsite";
import {
  awaitPageLoadByMutation,
  awaitElementById,
  awaitQuerySelection,
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";

export const Indeed: JobSite = {
  name: "Indeed",
  siteUrls: ["https://myjobs.indeed.com/saved"],
  jobUrl: ".indeed.com/viewjob",
  isJobSite: (href: string) => href.includes(Indeed.jobUrl as string),
  awaitPageLoad: () => awaitPageLoadByMutation(),
  addRenderable: async (renderable: HTMLElement) => {
    const navContainer = await awaitElementById("gnav-main-container");
    navContainer.parentElement!.insertBefore(renderable, navContainer);
  },
  removeRenderable: async (renderable: HTMLElement) => {
    if (renderable.parentElement) {
      renderable.parentElement.removeChild(renderable);
    }
  },
  scrapeJob: async (href: string): Promise<Partial<JobApplication> | null> => {
    let jobHref = href.split("&")[0];
    const result: Partial<JobApplication> = {
      jobDescriptionUrl: jobHref,
    };
    const topCardLines =
      (
        document.querySelector(
          'div[class*="jobsearch-InfoHeaderContainer"]',
        ) as HTMLElement | null
      )?.innerText.split("\n") ?? [];
    const indices = { title: 0, company: 2, location: 5 };
    result.company = topCardLines[indices.company];
    result.position = topCardLines[indices.title];
    result.location = topCardLines[indices.location];
    return result;
  },
};
