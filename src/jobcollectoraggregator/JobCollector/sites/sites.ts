import { Dice } from "./dice";
import { BuiltInBoston } from "./builtInBoston";
import { GreenhouseIO } from "./greenhouseio";
import { Indeed } from "./indeed";
import { LinkedIn } from "./linkedin";
import { USAJobs } from "./usajobs";
import { WelcomeToTheJungle } from "./welcomtothejungle";
import { JobSite } from "../jobsite";

export const JobSites: JobSite[] = [
  BuiltInBoston,
  Dice,
  GreenhouseIO,
  Indeed,
  LinkedIn,
  USAJobs,
  WelcomeToTheJungle,
];
const jobSiteNames = [
  BuiltInBoston.name,
  Dice.name,
  GreenhouseIO.name,
  Indeed.name,
  LinkedIn.name,
  USAJobs.name,
  WelcomeToTheJungle.name,
] as const;

export type JobSiteType = (typeof jobSiteNames)[number];
export const JobSiteTypeArray: JobSiteType[] = jobSiteNames.map(
  (name) => name as JobSiteType,
);

export function getJobSiteType(jobDescriptionUrl: string): JobSiteType | null {
  const siteIndex = JobSites.findIndex((jobSite) =>
    jobSite.isJobSite(jobDescriptionUrl),
  );
  return 0 <= siteIndex ? (JobSites[siteIndex].name as JobSiteType) : null;
}
