import { JobApplication } from "../jobApplication";
import { Site } from "../../common/site";
export interface JobSite extends Site {
  jobUrl: string | string[];
  isJobSite: (href: string) => boolean;
  awaitPageLoad: () => Promise<void>;
  addRenderable: (renderable: HTMLElement) => Promise<void>;
  removeRenderable: (renderable: HTMLElement) => Promise<void>;
  scrapeJob: (href: string) => Promise<Partial<JobApplication> | null>;
  subsite?: (href: string) => string | null;
}

export const CommuteWordsToType = {
  hybrid: 'hybrid',
  site: 'on-site',
  remote: 'remote'
}