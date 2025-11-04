import { JobSite } from "../jobsite";
import {
  awaitPageLoadByMutation,
  awaitElementById,
  awaitQuerySelection,
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";

export const GreenhouseIO: JobSite = {
  name: "GreenhouseIO",
  siteUrls: ["https://trueup.io/jobtracker"],
  jobUrl: ["job-boards.greenhouse.io/", "jobs.lever.co/", "jobs.ashbyhq.com/"],
  subsite: (href: string): string | null => {
    if (href.includes(GreenhouseIO.jobUrl[0])) return "greenhouse";
    if (href.includes(GreenhouseIO.jobUrl[1])) return "lever";
    if (href.includes(GreenhouseIO.jobUrl[2])) return "ashbyhq";
    return null;
  },
  isJobSite: (href: string) =>
    (GreenhouseIO.jobUrl as string[]).some((partialHref) =>
      href.includes(partialHref),
    ),
  awaitPageLoad: () => awaitPageLoadByMutation(),
  addRenderable: async (renderable: HTMLElement) => {
    let parent: HTMLElement;
    switch (GreenhouseIO.subsite!(window.location.href.toString())) {
      case "greenhouse":
        parent = await awaitElementById("react-portal-mount-point"); //(await awaitElement('button[aria-label="Apply"]')).parentElement
        break;
      case "lever":
        parent = await awaitQuerySelection(
          'div[class*="postings-btn-wrapper"]',
        );
        break;
      case "ashbyhq":
        parent = (await awaitQuerySelection("h1")).parentElement!;
        break;
      default:
        parent = document.body;
        break;
    }
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
    const subSite = GreenhouseIO.subsite!(href);
    const result: Partial<JobApplication> = {
      jobDescriptionUrl: href,
      source: GreenhouseIO.name

    };
    switch (subSite) {
      case "greenhouse":
        {
          if (href.includes('job-boards.greenhouse.io') && !href.includes('/embed/job_app?')) {
            result.company = (new URL(href)).pathname.split('/').filter(p => 0 < p.length)[0]
          } else if (document.querySelector("a.logo")) {
            result.company = (new URL((document.querySelector("a.logo") as HTMLAnchorElement).href)).hostname.split('.').filter(part => !['www', 'com', 'gov', 'net', 'io', 'tv'].includes(part))[0]
          }
          const titleLocation =
            (
              document.querySelector(
                'div[class*="job__title"]',
              ) as HTMLElement | null
            )?.innerText.split("\n") ?? [];
          result.position = titleLocation[0];
          result.location = titleLocation[1];
        }
        break;
      case "lever":
        {
          result.company = href.split("/").slice(-2)[0];
          const titleLocation =
            (
              document.querySelector(
                'div[class*="posting-headline"]',
              ) as HTMLElement | null
            )?.innerText.split("\n") ?? [];
          result.position = titleLocation[0];
          result.location = titleLocation[1].split(",")[0];
        }
        break;
      case "ashbyhq":
        result.company = href.split("/").slice(-2)[0];
        result.position = document.querySelector("h1")?.innerText!;
        result.location = (
          document.querySelector("h2")?.nextElementSibling as HTMLElement | null
        )?.innerText!;
        break;
      default:
        break;
    }
    return result;
  },
};
