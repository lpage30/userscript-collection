import { JobCollectorAggregatorConfig } from "./jobcollectoraggregator.config";
import { JobSiteType } from "./JobCollector/sites/sites";
export const DefaultJobApplicationFile = "jobs-default.json";
export const MergeRestUrl = `${JobCollectorAggregatorConfig.jobWebserverUrlBase}/api/job-applications/merge`;
export const JobCollectorDashboardPageUrl = `${JobCollectorAggregatorConfig.jobWebserverUrlBase}/${JobCollectorAggregatorConfig.jobDashboardPage}`;

export interface JobCollectorStatusReport {
  site: JobSiteType
  total: number
  oldest: Date
  newest: Date
}