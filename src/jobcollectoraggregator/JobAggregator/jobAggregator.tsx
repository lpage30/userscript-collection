// @grant       GM_addValueChangeListener
import React from "react";
import "../../common/ui/styles.scss";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByEvent,
  awaitElementById,
} from "../../common/await_functions";
import {
  aggregateJobs,
  mergeAggregation,
  COLLECTION_NAME,
} from "../jobCollections";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import { JobCollectorDashboardPageUrl } from "../job_service_types";
import JobCollectorDashboard from "./JobCollectorDashboard";
import { JobApplication } from "../jobApplication";

async function handleAggregations(aggregation: JobApplication[]) {
  if (0 < aggregation.length) {
    const response = await mergeAggregation(aggregation);
    return response.data.mergedApplicationCount
  }
  return 0
}
export const JobAggregator: Userscript = {
  name: "JobAggregator",
  containerId: 'jobs-dashboard',

  isSupported: (href: string): boolean => href.includes(JobCollectorDashboardPageUrl),
  preparePage: async (href: string): Promise<void> => {
    if (!href.includes(JobCollectorDashboardPageUrl)) {
      throw new Error(`${href} has no supported JobAggregator Userscript`);
    }
    await awaitPageLoadByEvent();
  },
  createContainer: async (href: string,): Promise<HTMLElement> => {
    const hrefParams = new URLSearchParams((new URL(href)).search.toLowerCase())
    const headless = ['true', ''].includes(hrefParams.get('headless'))
    return !headless ? createRenderableContainerAsChild(
      document.body,
      JobAggregator.containerId,
    ) : null
  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const initialJobs = aggregateJobs()
    let updateDashboard: (aggregatedJobs: JobApplication[]) => void | null = null

    const hrefParams = new URLSearchParams((new URL(href)).search.toLowerCase())
    const autoMerge = ['true', ''].includes(hrefParams.get('automerge'))
    const headless = ['true', ''].includes(hrefParams.get('headless'))

    if (autoMerge) {
      handleAggregations(initialJobs)
    }

    GM_addValueChangeListener(COLLECTION_NAME, () => {
      const jobs = aggregateJobs()
      if (autoMerge) {
        handleAggregations(jobs)
      }
      if (updateDashboard) {
        updateDashboard(jobs)
      }
    });
    if (headless) {
      return
    }

    renderInContainer(container, <JobCollectorDashboard
      initialAggregation={initialJobs}
      registerJobAggregation={(update) => { updateDashboard = update }}
      mergeAggregation={handleAggregations}
    />);
    await awaitElementById(container.id);
  },
};
