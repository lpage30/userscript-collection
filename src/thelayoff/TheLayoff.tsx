import React from "react";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import { TheLayoffDashboard } from "./TheLayoffDashboard";
import { TheLayoffCompanyScraper } from "./TheLayoffCompanyScraper";
import { TheLayoffCompanyBookmark } from "./TheLayoffCompanyBookmark";
import { awaitDelay } from "../common/await_functions";

const Scripts: Userscript[] = [
  TheLayoffCompanyScraper,
  TheLayoffDashboard,
  TheLayoffCompanyBookmark,
];

export async function main(lastLocationHref = "") {
  const currentLocationHref = window.location.href.toString();
  const scripts: Userscript[] = Scripts.filter((script) =>
    script.isSupported(currentLocationHref),
  );
  if (0 === scripts.length) {
    return;
  }
  const scriptName = scripts.map(({name}) => name).join(',')
  console.log(
    `############## ${scriptName} - ${currentLocationHref} ###############`,
  );
  if (currentLocationHref == lastLocationHref) {
    return;
  }
  window.onerror = (e) => {
    console.error(`Error ${scriptName}`, e);
  };
  if (lastLocationHref != "") {
    await awaitDelay(500);
  }
  const renderPromises = scripts.map(script => script.render(currentLocationHref))
  try {
    Promise.all(renderPromises)
    window.addEventListener("urlchange", (e) => {
      main(currentLocationHref);
    });
  } catch (e) {
    console.error(`Failed to load. ${scriptName}`, e);
  }
}

main();