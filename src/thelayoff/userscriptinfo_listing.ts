import { UserscriptInfoListing } from "../common/userscript.ts";

export const UserscriptListing: UserscriptInfoListing = Object.freeze({
  TheLayoffDashboardMenu: {
    name: "TheLayoffUserscript",
    filename: "thelayoff.user.js",
    headerFilepath: "src/thelayoff/userscript-header.ts",
    entryFilepath: "src/thelayoff/TheLayoff.tsx",
  },
});
