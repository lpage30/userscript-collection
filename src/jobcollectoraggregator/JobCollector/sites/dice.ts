import { JobSite, CommuteWordsToType } from "../jobsite";
import {
  awaitPageLoadByMutation,
  awaitElementById,
  awaitQueryAll
} from "../../../common/await_functions";
import { JobApplication } from "../../jobApplication";

export const Dice: JobSite = {
  name: "Dice",
  siteUrls: ["https://www.dice.com/my-jobs"],
  jobUrl: ".dice.com/job-detail",
  isJobSite: (href: string) => href.includes(Dice.jobUrl as string),
  awaitPageLoad: () => awaitPageLoadByMutation(),
  addRenderable: async (renderable: HTMLElement) => {
    const parent = Array.from(await awaitQueryAll('a')).filter(e => e.innerText.includes('Apply'))[0].parentElement
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
      jobDescriptionUrl: href,
      source: Dice.name

    };
    const detailedText = document.querySelector('h1').parentElement.parentElement.innerText
    const details = detailedText.split('\n')
    if (details) {
      const commuteKey = Object.keys(CommuteWordsToType).find(key => detailedText.toLowerCase().includes(key))
      let i = 0
      result.company = details[i];
      i++
      if (details[i].includes('Apply')) {
        i++
      }
      if (details[i].startsWith('Collect:')) {
        i++
      }
      result.position = details[i];
      i++
      if (details[i].includes('•')) {
        const locationDetails = details[i].split(' • ')
        result.location = locationDetails[0]
      }

      result.commuteType = commuteKey ? CommuteWordsToType[commuteKey] : undefined
    }
    return result;
  },
};
