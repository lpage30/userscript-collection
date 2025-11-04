import { toHashCode, isString } from "../common/functions";
import { parseDate, toMonthDayYearDate } from "../common/datetime";
import {
  JobSiteType,
  JobSiteTypeArray,
  getJobSiteType,
} from "./JobCollector/sites/sites";

export type JobSourceType = JobSiteType | "Manually-Entered";
export const JobSourceTypeArray: JobSourceType[] = [
  ...JobSiteTypeArray,
  "Manually-Entered",
];

const ApplicationNextActionNames = [
  "Apply",
  "Phone Screen",
  "Interview",
  "Decision",
] as const;
export type ApplicationNextAction = (typeof ApplicationNextActionNames)[number];
export const ApplicationNextActionArray: ApplicationNextAction[] =
  ApplicationNextActionNames.map((name) => name as ApplicationNextAction);

export interface JobApplication {
  id: string;
  date: Date;
  company: string;
  position: string;
  location: string;
  commuteType: string;
  jobDescriptionUrl: string;
  salaryHistoryUrl: string | null;
  glassdoorUrl: string;
  applicationDate: Date | null;
  phoneScreenDate: Date | null;
  interviewDate: Date | null;
  nextAction: ApplicationNextAction;
  source: string
}
export const JobFieldToDisplayName = Object.freeze({
  id: "Id",
  date: "Date",
  company: "Company",
  position: "Position",
  location: "Location",
  commuteType: "Commute Type",
  jobDescriptionUrl: "Job Description Link",
  salaryHistoryUrl: "Salary History Link",
  glassdoorUrl: "Glassdoor Link",
  applicationDate: "Application Date",
  phoneScreenDate: "Phone Screen Date",
  interviewDate: "Interview Date",
  nextAction: "Next Action",
  source: "Listing Source",
});

export const emptyApplication = (href: string = ""): JobApplication => ({
  id: "",
  date: new Date(),
  company: "",
  position: "",
  location: "",
  commuteType: "",
  jobDescriptionUrl: href,
  salaryHistoryUrl: null,
  glassdoorUrl: "",
  applicationDate: null,
  phoneScreenDate: null,
  interviewDate: null,
  nextAction: "Apply",
  source: "Manually-Entered",
});

export const getNextAction = (
  application: Partial<JobApplication>,
): ApplicationNextAction => {
  if (application.interviewDate) {
    return "Decision";
  }
  if (application.phoneScreenDate) {
    return "Interview";
  }
  if (application.applicationDate) {
    return "Phone Screen";
  }
  return "Apply";
};

export const getNextActionClass = (nextAction: string) => {
  return `status status-${nextAction.toLowerCase().replace(" ", "-")}`;
};

export const getKnownNameValueDates = (
  application: JobApplication,
): [string, string][] =>
  [
    ["Interview", application.interviewDate],
    ["Phone Screen", application.phoneScreenDate],
    ["Applied", application.applicationDate],
    ["Added", application.date],
  ]
    .filter((nameDate) => nameDate[1] != null && nameDate[1] != undefined)
    .map((nameDate) => [
      nameDate[0],
      toMonthDayYearDate(nameDate[1] as Date),
    ]) as [string, string][];

export const toFilledinJobApplication = (
  application: Partial<JobApplication> | null | undefined,
): JobApplication => {
  const result = {
    ...emptyApplication(),
    ...(application ?? {}),
    source: getJobSiteType(application.jobDescriptionUrl) ?? "Manually-Entered"
  };
  return {
    ...result,
    id: toHashCode(result.jobDescriptionUrl),
    nextAction: getNextAction(result),
  };
};

export function toJobApplication(anyJob: any): JobApplication {
  return toFilledinJobApplication({
    ...anyJob,
    date: isString(anyJob.date) ? parseDate(anyJob.date) : anyJob.date,
    applicationDate: isString(anyJob.applicationDate)
      ? parseDate(anyJob.applicationDate)
      : anyJob.applicationDate,
    phoneScreenDate: isString(anyJob.phoneScreenDate)
      ? parseDate(anyJob.phoneScreenDate)
      : anyJob.phoneScreenDate,
    interviewDate: isString(anyJob.interviewDate)
      ? parseDate(anyJob.interviewDate)
      : anyJob.interviewDate,
  });
}

export interface JobApplicationFilters {
  nextAction?: ApplicationNextAction;
  company?: string;
  location?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}
