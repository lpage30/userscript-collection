import { UserscriptInfoListing } from "../common/userscript.ts";

export const UserscriptListing: UserscriptInfoListing = Object.freeze({
  JobCollectorAggregator: {
    name: "JobCollectorAggregatorUserscript",
    filename: "job-collector-aggregator.user.js",
    headerFilepath: "src/jobcollectoraggregator/userscript-header.ts",
    entryFilepath: "src/jobcollectoraggregator/JobCollectorAggregator.tsx",
  },
});
