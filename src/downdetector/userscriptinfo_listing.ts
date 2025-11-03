import { UserscriptInfoListing } from "../common/userscript.ts";

export const UserscriptListing: UserscriptInfoListing = Object.freeze({
  DownDetectorDashboardStatus: {
    name: "DownDetectorUserscript",
    filename: "downdetector-dashboard-status.user.js",
    headerFilepath: "src/downdetector/userscript-header.ts",
    entryFilepath: "src/downdetector/DownDetector.tsx",
  },
});
