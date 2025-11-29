import React from "react";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import { DownDetectorDashboard } from "./dashboard/DownDetectorDashboard";
import { DownDetectorCompanyStatus } from "./status/DownDetectorCompanyStatus";
import { DownDetectorCompanyStatusMap } from "./status/DownDetectorCompanyStatusMap";
import { AWSHealthStatus } from "../statusAPIs/userscripts/AWSHealthStatus";
import { AzureHealthStatus } from "../statusAPIs/userscripts/AzureHealthStatus";
import { GCPHealthStatus } from "../statusAPIs/userscripts/GCPHealthStatus";
import { OCIHealthStatus } from "../statusAPIs/userscripts/OCIHealthStatus";
import { IBMHealthStatus } from "../statusAPIs/userscripts/IBMHealthStatus";
import { FastlyHealthStatus } from "../statusAPIs/userscripts/FastlyHealthStatus";
import { Microsoft365HealthStatus } from "../statusAPIs/userscripts/Microsoft365HealthStatus";
import { awaitDelay } from "../common/await_functions";

const Scripts: Userscript[] = [
  DownDetectorDashboard,
  DownDetectorCompanyStatus,
  DownDetectorCompanyStatusMap,
  AWSHealthStatus,
  AzureHealthStatus,
  GCPHealthStatus,
  OCIHealthStatus,
  IBMHealthStatus,
  FastlyHealthStatus,
  Microsoft365HealthStatus,
];

export async function main(lastLocationHref = "") {
  const currentLocationHref = window.location.href.toString();
  const script: Userscript | undefined = Scripts.find((script) =>
    script.isSupported(currentLocationHref),
  );
  if (undefined == script) {
    return;
  }
  console.log(
    `############## ${script.name} - ${currentLocationHref} ###############`,
  );
  if (currentLocationHref == lastLocationHref) {
    return;
  }
  window.onerror = (e) => {
    console.error(`Error ${script.name}`, e);
  };
  if (lastLocationHref != "") {
    await awaitDelay(500);
  }
  try {
    await script.render(currentLocationHref);
    window.addEventListener("urlchange", (e) => {
      main(currentLocationHref);
    });
  } catch (e) {
    console.error(`Failed to load. ${script.name}`, e);
  }
}

main();
