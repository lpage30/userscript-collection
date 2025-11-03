import { createViteUserscriptDefineConfigFunction } from "../create-vite-define-configs";
import { UserscriptListing } from "./userscriptinfo_listing";

const userscriptInfo = UserscriptListing.AiAssistantSiteProxy!;
const lib = {
  entry: userscriptInfo.entryFilepath,
  name: userscriptInfo.name,
  fileName: (_format: any) => userscriptInfo.filename,
};
const userscript_header_files = [userscriptInfo.headerFilepath];
const defineConfig = createViteUserscriptDefineConfigFunction(
  lib,
  [],
  userscript_header_files,
);
export default defineConfig;
