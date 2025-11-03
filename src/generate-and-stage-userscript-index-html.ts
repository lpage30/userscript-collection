import { __projectDirname } from "./create-vite-define-configs";
import {
  getUserscriptListing,
  createUserscriptIndexPage,
} from "./userscriptinfo_listing";
import fs from "fs";
import path from "path";

async function buildAndStageIndexHtml() {
  const projectDirpath = __projectDirname;
  const outDirpath = path.join(projectDirpath, "dist");
  const userscriptListing = await getUserscriptListing(projectDirpath);
  const indexPageContent = createUserscriptIndexPage(
    userscriptListing,
    outDirpath,
  );
  fs.writeFileSync(`${outDirpath}/index.html`, indexPageContent, "utf8");
  console.log(`generated ${outDirpath}/index.html`);
}

buildAndStageIndexHtml();
