import { UserscriptInfoListing } from "../common/userscript.ts";

export const UserscriptListing: UserscriptInfoListing = Object.freeze({
  TheLayoffDashboardMenu: {
    name: "TheLayoffUserscript",
    filename: "thelayoff-dashboard-menu.user.js",
    headerFilepath: "src/layoffsmenu/userscript-header.ts",
    entryFilepath: "src/layoffsmenu/TheLayoffMenu.tsx",
  },
});
