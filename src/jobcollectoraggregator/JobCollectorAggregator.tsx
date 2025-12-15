import React from "react";
import "../common/ui/styles.scss";
import { Userscript, RunUserscripts } from "../common/userscript";
import { JobAggregator } from "./JobAggregator/JobAggregator";
import { JobCollector } from "./JobCollector/JobCollector";

const jobCollectorAggregatorUserscripts: Userscript[] = [
  JobAggregator,
  JobCollector
];

RunUserscripts(jobCollectorAggregatorUserscripts)