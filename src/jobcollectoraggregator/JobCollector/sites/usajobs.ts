import { JobSite } from "../jobsite";
import {
  awaitPageLoadByEvent,
  awaitElementById,
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";

export const USAJobs: JobSite = {
  name: "USAJobs",
  siteUrls: ["https://www.usajobs.gov/applicant/dashboard/savedjobs"],
  jobUrl: ".usajobs.gov/job",
  isJobSite: (href: string) => href.includes(USAJobs.jobUrl as string),
  awaitPageLoad: () => awaitPageLoadByEvent(),
  addRenderable: async (renderable: HTMLElement) => {
    const parent = await awaitElementById("main_content");
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
    const summaryOverviewLines =
      (
        document.getElementById("help_content")
          ?.firstElementChild as HTMLElement | null
      )?.innerText
        .split("\n")
        .filter((t) => t.trim() != "") ?? [];
    const headerLines =
      document.getElementById("joa-header")?.innerText.split("\n") ?? [];
    const locationIndex =
      summaryOverviewLines.findIndex((t) => t.trim() == "Location") + 1;
    const locationEndIndex = summaryOverviewLines.findIndex(
      (t) => t.trim() == "Appointment type",
    );
    const titleIndex = 0;
    const companyIndex = 1;
    result.position = headerLines[titleIndex];
    result.company = `${headerLines[companyIndex]}\n${headerLines[companyIndex + 1]}`;
    result.location = "";
    for (let i = locationIndex; i <= locationEndIndex; i++) {
      result.location = `${result.location}${result.location.length > 0 ? "|" : ""}${summaryOverviewLines[i]}`;
    }
    return result;
  },
};
