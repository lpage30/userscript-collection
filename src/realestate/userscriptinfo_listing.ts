import { UserscriptInfoListing } from "../common/userscript.ts";

export const UserscriptListing: UserscriptInfoListing = Object.freeze({
  Realestate: {
    name: "RealestateUserscript",
    filename: "realestate.user.js",
    headerFilepath: "src/realestate/userscript-header.ts",
    entryFilepath: "src/realestate/Realestate.tsx",
  },
});
