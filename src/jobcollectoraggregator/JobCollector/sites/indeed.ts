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
  jobUrl: [".indeed.com/viewjob", "indeed.com/jobs?"],
  subsite: (href: string): string | null => {
    if (href.includes(Indeed.jobUrl[0])) return "jobpage";
    if (href.includes(Indeed.jobUrl[1])) return "searchpage";
    return null;
  },

  isJobSite: (href: string) => (Indeed.jobUrl as string[]).some((partialHref) =>
      href.includes(partialHref),
    ),
  awaitPageLoad: () => awaitPageLoadByMutation(),
  addRenderable: async (renderable: HTMLElement) => {
    switch (Indeed.subsite!(window.location.href.toString())) {
      case 'jobpage': {
        const navContainer = await awaitElementById("gnav-main-container")
        if (!Array.from(navContainer.parentElement!.children).some(child => child.id === renderable.id)) {
          navContainer.parentElement!.insertBefore(renderable, navContainer);
        }
      }
      break
      case 'searchpage': {
        const parent = (await awaitElementById('jobsearch-ViewJobButtons-container')).parentElement!
        if (!Array.from(parent.children).some(child => child.id === renderable.id)) {
          parent.appendChild(renderable);
        }
      }
      break
      default:
        document.body.appendChild(renderable)
        break
    }
  },
  removeRenderable: async (renderable: HTMLElement) => {
    if (renderable.parentElement) {
      renderable.parentElement.removeChild(renderable);
    }
  },
  scrapeJob: async (href: string): Promise<Partial<JobApplication> | null> => {
    const subSite = Indeed.subsite!(href);
    if (subSite === 'jobpage') {
      const jobHref = href.split("&")[0];
      const result: Partial<JobApplication> = {
        jobDescriptionUrl: jobHref,
        source: Indeed.name
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
    }
    if (subSite === 'searchpage') {
      const jobkey =(new URL(document.getElementById('jobsearch-ViewjobPaneWrapper').querySelector('a').href)).searchParams.get('fromjk')
      const jobHref = (document.querySelector(`a[data-jk="${jobkey}"]`) as HTMLAnchorElement).href
      const result: Partial<JobApplication> = {
        jobDescriptionUrl: jobHref,
        source: Indeed.name
      };
      const topCardLines =
        (
          document.querySelector(
            'div[class*="jobsearch-InfoHeaderContainer"]',
          ) as HTMLElement | null
        )?.innerText.split("\n") ?? [];
      const indices = { title: 0, company: 2, location: 6 };
      result.company = topCardLines[indices.company];
      result.position = topCardLines[indices.title];
      result.location = topCardLines[indices.location];
      return result;
    }
  },
};
