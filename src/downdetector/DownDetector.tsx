import React from "react";
import "../common/ui/styles.css";
import { Userscript, RunUserscripts } from "../common/userscript";
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

const downDetectorUserscripts: Userscript[] = [
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
RunUserscripts(downDetectorUserscripts)
