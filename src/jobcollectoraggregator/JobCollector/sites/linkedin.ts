import { JobSite } from "../jobsite";
import {
  awaitPageLoadByMutation,
  awaitQueryAll,
  awaitQuerySelection,
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";
import { isEmpty } from "../../../common/functions";

export const LinkedIn: JobSite = {
  name: "LinkedIn",
  siteUrls: ["https://www.linkedin.com/my-items/saved-jobs"],
  jobUrl: ".linkedin.com/jobs/view",
  isJobSite: (href: string) => href.includes(LinkedIn.jobUrl as string),
  awaitPageLoad: () => awaitPageLoadByMutation(),
  addRenderable: async (renderable: HTMLElement) => {
    const parent = (
      await awaitQueryAll('button[class*="jobs-save-button"]')
    ).filter((e) => 0 < e.innerText.length)[0].parentElement!;
    if (!Array.from(parent.children).some(child => child.id === renderable.id)) {
      parent.appendChild(renderable);
    }
  },

  removeRenderable: async (renderable: HTMLElement) => {
    if (renderable.parentElement) {
      renderable.parentElement.removeChild(renderable);
    }
  },
  scrapeJob: async (href: string): Promise<Partial<JobApplication> | null> => {
    const result: Partial<JobApplication> = {
      jobDescriptionUrl: href.split("/?")[0],
      source: LinkedIn.name
    };

    const topCardLines =
      (
        document.querySelector(
          'div[class*="job-details-jobs-unified-top-card__primary-description-container"]',
        ) ?? document.querySelector('div[class*="top-card-layout"]')
      )?.parentElement?.innerText.split("\n") ?? [];
    if (isEmpty(topCardLines[3].trim())) {
      const indices = { companyLocation: 1, title: 0, dates: 2 };
      const companyLocation = topCardLines[indices.companyLocation].split("  ");
      result.company = companyLocation[0];
      result.position = topCardLines[indices.title];
      result.location = companyLocation[1];
    } else {
      const indices = { company: 0, title: 3, locationDates: 4 };
      result.company = topCardLines[indices.company];
      result.position = topCardLines[indices.title];
      const locationDates = topCardLines[indices.locationDates].split(" · ");
      result.location = locationDates[0];
    }
    return result;
  },
};
