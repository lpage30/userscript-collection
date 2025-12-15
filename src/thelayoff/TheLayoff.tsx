import React from "react";
import "../common/ui/styles.scss";
import { Userscript, RunUserscripts } from "../common/userscript";
import { TheLayoffDashboard } from "./TheLayoffDashboard";
import { TheLayoffCompanyScraper } from "./TheLayoffCompanyScraper";
import { TheLayoffCompanyBookmark } from "./TheLayoffCompanyBookmark";

const layoffUserscripts: Userscript[] = [
  TheLayoffCompanyScraper,
  TheLayoffDashboard,
  TheLayoffCompanyBookmark,
];

RunUserscripts(layoffUserscripts);