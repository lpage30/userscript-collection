import { UserscriptInfo, UserscriptHeaderInfo } from "./userscript";
import { getServerDirectories } from "../common/server_directories";
import { path } from "../common/path";
import fs from "fs-extra";

export function addUserscriptHeaderInfo(
  userscriptBuildInfo: UserscriptInfo,
): UserscriptInfo {
  const fullHeaderFilepath = path.join(
    getServerDirectories().project,
    userscriptBuildInfo.headerFilepath,
  );
  if (!fs.existsSync(fullHeaderFilepath)) {
    throw new Error(`${userscriptBuildInfo.headerFilepath} does not exist`);
  }
  const headerLines = fs.readFileSync(fullHeaderFilepath, "utf8").split("\n");
  const result: UserscriptHeaderInfo = {
    name: "",
    description: "",
    version: "",
    includes: [],
    matches: [],
    grants: [],
  };
  let parseHeader = false;
  for (const line of headerLines) {
    if (!line.trim().startsWith("//")) {
      continue;
    }
    if (line.includes("==UserScript==")) {
      parseHeader = true;
      continue;
    }
    if (line.includes("==/UserScript==")) {
      break;
    }
    if (!parseHeader) {
      continue;
    }
    if (line.includes("@name")) {
      const name = line.split("@name")[1].trim();
      result.name = name;
      continue;
    }
    if (line.includes("@version")) {
      const version = line.split("@version")[1].trim();
      result.version = version;
      continue;
    }
    if (line.includes("@description")) {
      const description = line.split("@description")[1].trim();
      result.description = description;
      continue;
    }
    if (line.includes("@include")) {
      const include = line.split("@include")[1].trim();
      result.includes.push(include);
      continue;
    }
    if (line.includes("@match")) {
      const match = line.split("@match")[1].trim();
      result.matches.push(match);
      continue;
    }
    if (line.includes("@grant")) {
      const grant = line.split("@grant")[1].trim();
      result.grants.push(grant);
      continue;
    }
  }
  return {
    ...userscriptBuildInfo,
    headerInfo: result,
  };
}
