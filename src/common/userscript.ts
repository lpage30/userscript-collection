import { awaitDelay } from "./await_functions";
export interface Userscript {
  name: string;
  containerId: string;
  isSupported: (href: string) => boolean;
  preparePage: (href: string) => Promise<void>
  cleanupContainers: (href: string) => Promise<boolean>
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
const isEqual = (left: URL | null, right: URL | null): boolean => {
  if ([left, right].includes(null)) return false
  if (left.origin === right.origin && left.pathname === right.pathname) return true
  return false
}
export async function RunUserscripts(userscripts: Userscript[], previousLocationHref = "") {
  const currentLocationURL = new URL(window.location.href.toString());
  const previousLocationURL = 0 === previousLocationHref.length ? null : new URL(previousLocationHref)

  const scripts: Userscript[] = userscripts.filter(script => script.isSupported(currentLocationURL.href))
  if (0 == scripts.length || isEqual(previousLocationURL, currentLocationURL)) {
    return;
  }
  const scriptName = `[${scripts.map(script => script.name).join(',')}]`
  console.log(
    `############## ${scriptName} - ${currentLocationURL.href} ###############`,
  );
  window.onerror = (e) => {
    console.error(`Error ${scriptName}`, e);
  };
  if (null === previousLocationURL) {
    await awaitDelay(500);
  }
  let action = ''
  let name = ''
  const containers: HTMLElement[] = []
  try {
    action = 'preparePage'
    name = scriptName
    for (const script of scripts) {
      name = script.name
      await script.preparePage(currentLocationURL.href)
    }
    action = 'cleanupContainers'
    name = scriptName
    for (const script of scripts) {
      name = script.name
      if (await script.cleanupContainers(currentLocationURL.href)) {
        console.log(`Cleanedup Containers> ${name} ${currentLocationURL.href}`)
      }
    }
    action = 'createContainer'
    name = scriptName
    for (const script of scripts) {
      name = script.name
      const container = await script.createContainer(currentLocationURL.href)
      containers.push(container)
    }
    action = 'renderInContainer'
    name = scriptName
    for (let i = 0; i < scripts.length; i++) {
      name = scripts[i].name
      await scripts[i].renderInContainer(currentLocationURL.href, containers[i])
    }
    window.addEventListener("urlchange", (e) => {
      RunUserscripts(userscripts, currentLocationURL.href);
    });
  } catch (e) {
    console.error(`Failed loading ${scriptName}. ${name}.${action}`, e);
  }
}