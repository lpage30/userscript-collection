import { awaitDelay } from "./await_functions";
export interface Userscript {
  name: string;
  containerId: string;
  isSupported: (href: string) => boolean;
  preparePage: (href: string) => Promise<void>
  createContainer: (href: string) => Promise<HTMLElement>
  renderInContainer: (href: string, container: HTMLElement) => Promise<void>

}

export interface UserscriptHeaderInfo {
  name: string;
  description: string;
  version: string;
  includes: string[];
  matches: string[];
  grants: string[];
}
export interface UserscriptInfo {
  name: string;
  filename: string;
  headerFilepath: string;
  entryFilepath: string;
  headerInfo?: UserscriptHeaderInfo;
}
export type UserscriptInfoListing = { [name: string]: UserscriptInfo };

export async function RunUserscripts(userscripts: Userscript[], lastLocationHref = "") {
  const currentLocationHref = window.location.href.toString();
  const scripts: Userscript[] = userscripts.filter(script => script.isSupported(currentLocationHref))
  if (0 == scripts.length) {
    return;
  }
  const scriptName = `[${scripts.map(script => script.name).join(',')}]`
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
  let action = 'preparePage'
  let name = scriptName
  const containers: HTMLElement[] = []
  try {
    for (const script of scripts) {
      name = script.name
      await script.preparePage(currentLocationHref)
    }
    action = 'createContainer'
    name = scriptName
    for (const script of scripts) {
      name = script.name
      containers.push(await script.createContainer(currentLocationHref))
    }
    action = 'renderInContainer'
    name = scriptName
    for (let i = 0; i < scripts.length; i++) {
      name = scripts[i].name
      await scripts[i].renderInContainer(currentLocationHref, containers[i])
    }
    window.addEventListener("urlchange", (e) => {
      RunUserscripts(userscripts, currentLocationHref);
    });
  } catch (e) {
    console.error(`Failed loading ${scriptName}. ${name}.${action}`, e);
  }
}