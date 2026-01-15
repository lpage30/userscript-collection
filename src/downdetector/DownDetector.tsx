import React from "react";
import "../common/ui/styles.scss";
import { Userscript, RunUserscripts } from "../common/userscript";
import { DownDetectorDashboard } from "./dashboard/DownDetectorDashboard";
import { DownDetectorCompanyStatus } from "./status/DownDetectorCompanyStatus";
import { DownDetectorCompanyStatusMap } from "./status/DownDetectorCompanyStatusMap";
import { StatusAPIUserscripts } from "../statusAPIs/statusAPIs"
import { GeoblackoutOutageCollectingUserscripts } from "../geoblackout/OutageBreakdownAPI";

const downDetectorUserscripts: Userscript[] = [
  DownDetectorDashboard,
  DownDetectorCompanyStatus,
  DownDetectorCompanyStatusMap,
  ...StatusAPIUserscripts,
  ...GeoblackoutOutageCollectingUserscripts,
];
RunUserscripts(downDetectorUserscripts)
