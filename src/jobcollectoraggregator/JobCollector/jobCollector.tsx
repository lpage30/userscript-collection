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

const renderableId = "job-saver-button";
export const JobCollector: Userscript = {
  name: "JobCollector",

  isSupported: (href: string): boolean =>
    JobSites.some((site) => site.isJobSite(href)),

  render: async (href: string): Promise<void> => {
    const jobSite = JobSites.find((site) => site.isJobSite(href));
    if (jobSite == undefined) {
      throw new Error(`${href} has no supported JobCollector Userscript`);
    }
    await jobSite.awaitPageLoad();

    const renderable = document.createElement("div");
    renderable.id = renderableId;
    renderable.style.alignContent = "center";
  
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
      await jobSite.removeRenderable(renderable);
      setAsClickableTextComponent({
        element: renderable,
        getTextSettings,
        onClick,
      });
      await jobSite.addRenderable(renderable!);
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
    await awaitElementById(renderable.id, {
      minChildCount: 1,
      maxRetries: 60,
      intervalMs: 250,
    });
  },
};
