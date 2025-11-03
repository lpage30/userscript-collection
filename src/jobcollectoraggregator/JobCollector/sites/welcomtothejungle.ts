import { JobSite } from "../jobsite";
import {
  awaitPageLoadByEvent,
  awaitQuerySelection,
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";

export const WelcomeToTheJungle: JobSite = {
  name: "WelcomeToTheJungle",
  siteUrls: ["https://app.welcometothejungle.com/"],
  jobUrl: "app.welcometothejungle.com/jobs",
  isJobSite: (href: string) =>
    href.includes(WelcomeToTheJungle.jobUrl as string),
  awaitPageLoad: () => awaitPageLoadByEvent(),
  addRenderable: async (renderable: HTMLElement) => {
    const parent = (
      await awaitQuerySelection('div[data-testid="job-locations"]')
    ).parentElement!;
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
    const jobSection = await awaitQuerySelection(
      'div[data-testid="job-section"]',
    );
    const jobSectionLines =
      (jobSection as HTMLElement | null)?.innerText
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => 0 != t.length) ?? [];
    const [title, company] = jobSectionLines[0].split(",").map((t) => t.trim());
    ((result.position = title), (result.company = company));
    result.location = jobSectionLines.slice(-1)[0].trim();
    return result;
  },
};
