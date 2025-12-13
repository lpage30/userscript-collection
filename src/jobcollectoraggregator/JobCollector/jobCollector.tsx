import React from "react";
import "../../common/ui/styles.css";
import { JobSites } from "./sites/sites";
import { Userscript } from "../../common/userscript";
import {
  setAsClickableTextComponent,
  TextSettings,
} from "../../common/ui/clickableText";
import { awaitElementById, awaitQueryAll } from "../../common/await_functions";
import { collectJob, uncollectJob, isJobCollected } from "../jobCollections";

export const JobCollector: Userscript = {
  name: "JobCollector",
  containerId: 'job-saver-button',
  isSupported: (href: string): boolean =>
    JobSites.some((site) => site.isJobSite(href)),
  preparePage: async (href: string): Promise<void> => {
    const jobSite = JobSites.find((site) => site.isJobSite(href));
    if (jobSite == undefined) {
      throw new Error(`${href} has no supported JobCollector Userscript`);
    }
    await jobSite.awaitPageLoad();

  },
  createContainer: async (href: string): Promise<HTMLElement> => {
    const container = document.createElement("div");
    container.id = JobCollector.containerId;
    container.style.alignContent = "center";
    return container
  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const jobSite = JobSites.find((site) => site.isJobSite(href));

    const getTextSettings = async (): Promise<TextSettings> => {
      const job = await jobSite.scrapeJob(window.location.href);
      const jobName = `${job?.position}@${job?.company}`;
      if (isJobCollected(job)) {
        return {
          innerHTML: `Uncollect: ${jobName}`,
          backgroundColors: {
            hover: "#DC143C",
            regular: "#B22222",
          },
          fontSize: 12,
        };
      }
      return {
        innerHTML: `<b>Collect: ${jobName}</b>`,
        backgroundColors: {
          hover: "#32CD32",
          regular: "#008000",
        },
        fontSize: 12,
      };
    };

    const renderRenderable = async () => {
      await jobSite.removeRenderable(container);
      setAsClickableTextComponent({
        element: container,
        getTextSettings,
        onClick,
      });
      await jobSite.addRenderable(container!);
    };
    const onClick = async (): Promise<void> => {
      const clickedJob = await jobSite.scrapeJob(window.location.href);
      if (clickedJob) {
        isJobCollected(clickedJob)
          ? uncollectJob(clickedJob)
          : collectJob(clickedJob);
      }
      return Promise.resolve();
    };
    await renderRenderable();
    await awaitElementById(container.id, {
      minChildCount: 1,
      maxRetries: 60,
      intervalMs: 250,
    });
  },
};
