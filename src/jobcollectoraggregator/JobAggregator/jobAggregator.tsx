// @grant       GM_addValueChangeListener
import React from "react";
import "../../common/ui/styles.css";
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
import { BlinkingRedText } from "../../common/ui/blinking_red_text";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import { JobsManagerPageUrl } from "../job_service_types";

async function handleAggregations() {
  const aggregation = aggregateJobs();
  if (0 < aggregation.length) {
    const response = await mergeAggregation(aggregation);
    if (0 < response.data?.mergedApplicationCount!) {
      const parent = await awaitElementById("job-aggregator");
      const container = createRenderableContainerAsChild(
        parent,
        "job-aggregator-text",
      );
      renderInContainer(
        container,
        <BlinkingRedText
          text={`${aggregation.length} aggregated jobs. Refresh Page.`}
        />,
      );
    }
  }
}

export const JobAggregator: Userscript = {
  name: "JobAggregator",

  isSupported: (href: string): boolean => href.includes(JobsManagerPageUrl),

  render: async (href: string): Promise<void> => {
    if (!href.includes(JobsManagerPageUrl)) {
      throw new Error(`${href} has no supported JobAggregator Userscript`);
    }
    await awaitPageLoadByEvent();
    await handleAggregations();
    GM_addValueChangeListener(COLLECTION_NAME, () => handleAggregations());
  },
};
