// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_xmlhttpRequest
import {
  emptyApplication,
  JobApplication,
  toJobApplication,
} from "./jobApplication";
import { DefaultJobApplicationFile, MergeRestUrl } from "./job_service_types";
import { ApiResponse } from "../common/service_types";

export const COLLECTION_NAME = "COLLECTED_JOBS";

export function aggregateJobs(): JobApplication[] {
  return JSON.parse(GM_getValue(COLLECTION_NAME, "[]")).map(toJobApplication);
}
export function isJobCollected(
  application: Partial<JobApplication> | null,
): boolean {
  return application
    ? aggregateJobs()
        .map(({ jobDescriptionUrl }) => jobDescriptionUrl)
        .includes(application.jobDescriptionUrl!)
    : false;
}
export function collectJob(application: Partial<JobApplication> | null): void {
  if (application == null) {
    return;
  }
  const newApplication: JobApplication = {
    ...emptyApplication(),
    ...application,
  };
  const existingApplications: JobApplication[] = aggregateJobs();
  if (
    !existingApplications
      .map(({ jobDescriptionUrl }) => jobDescriptionUrl)
      .includes(newApplication.jobDescriptionUrl)
  ) {
    existingApplications.push(newApplication);
    GM_setValue(COLLECTION_NAME, JSON.stringify(existingApplications, null, 2));
  }
}
export function uncollectJob(
  application: Partial<JobApplication> | null,
): void {
  if (application == null) {
    return;
  }
  const newApplication: JobApplication = {
    ...emptyApplication(),
    ...application,
  };
  const existingApplications: JobApplication[] = aggregateJobs();
  if (
    existingApplications
      .map(({ jobDescriptionUrl }) => jobDescriptionUrl)
      .includes(newApplication.jobDescriptionUrl)
  ) {
    GM_setValue(
      COLLECTION_NAME,
      JSON.stringify(
        existingApplications.filter(
          ({ jobDescriptionUrl }) =>
            jobDescriptionUrl != newApplication.jobDescriptionUrl,
        ),
        null,
        2,
      ),
    );
  }
}

export function storeJobs(jobApplications: JobApplication[]) {
  GM_setValue(
    COLLECTION_NAME,
    JSON.stringify(
      jobApplications,
      null,
      2,
    ),
  );
}

export function mergeAggregation(
  aggregatedJobs: JobApplication[],
): Promise<ApiResponse<{ mergedApplicationCount: number }>> {
  return new Promise<ApiResponse<{ mergedApplicationCount: number }>>(
    (resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${MergeRestUrl}/${DefaultJobApplicationFile}`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ applications: aggregatedJobs }),
        onload: (response: GM_xmlhttpRequestResponse) => {
          const result: ApiResponse<{ mergedApplicationCount: number }> =
            JSON.parse(response.responseText);
          resolve(result);
        },
        onerror: (response) => reject(new Error(response.statusText)),
      });
    },
  );
}
