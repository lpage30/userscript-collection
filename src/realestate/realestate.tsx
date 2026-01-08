import './registergeocoding'
import React from "react";
import "../common/ui/styles.scss";
import { Userscript, RunUserscripts } from "../common/userscript";
import { RealEstateSite, PropertyPageType, propertyPageTypeString } from "./realestatesitetypes";
import { RedfinSite } from "./redfin/redfin_site";
import { RealtorSite } from "./realtor/realtor_site";
import { ZooplaSite } from "./zoopla/zoopla_site";
import { awaitDelay, awaitElementById } from "../common/await_functions";
import {
  renderInContainer,
} from "../common/ui/renderRenderable";
import { RealestateControlPanel } from "./RealestateControlPanel";

const realestateSites: RealEstateSite[] = [
  RedfinSite,
  RealtorSite,
  ZooplaSite
];

export function toUserscript(site: RealEstateSite): Userscript {
  return {
    name: site.name,
    containerId: site.containerId,
    isSupported: (href: string): boolean => site.isSupported(href),
    preparePage: async (href: string): Promise<void> => {
      const page = Object.values(site.pages).find(page => page.isPage(href))
      if ([undefined, null].includes(page)) return
      await page.awaitForPageLoad()

    },
    cleanupContainers: async (href: string): Promise<boolean> => {
      let result = false
      const ids: string[] = [site.containerId, `${site.containerId}-panel`]
      ids.forEach(id => {
        Array.from(document.querySelectorAll(`div[id="${id}"]`)).forEach((element: HTMLElement) => {
          element.style.display = 'none'
          element.innerHTML = ''
          element.remove()
          result = true
        })
      })
      return result
    },
    createContainer: async (href: string): Promise<HTMLElement> => {
      const container = document.createElement("div");
      container.id = site.containerId;
      const page = Object.values(site.pages).find(page => page.isPage(href))
      if ([undefined, null].includes(page)) return container
      page.insertContainerOnPage(container)

      return container
    },

    renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
      const renderableId = `${container.id}-panel`
      const page = Object.values(site.pages).find(page => page.isPage(href))
      if ([undefined, null].includes(page)) return
      const toggleMaps = async (parentElement?: HTMLElement) => {
        (await page.getMapToggleElements(parentElement)).forEach(element => element.click())
      }
      await awaitDelay(1000)
      const properties = await page.scrapePage()
      const title = `${site.name} (${properties[0].country}) ${propertyPageTypeString(page.pageType)}${PropertyPageType.Single === page.pageType ? ` ${properties[0].address}` : ''}`
      renderInContainer(container, <RealestateControlPanel
        id={renderableId}
        siteName={site.name}
        title={title}
        toggleMapDisplay={toggleMaps}
        properties={properties}
        canToggleMapInDashboard={[PropertyPageType.Feed].includes(page.pageType)}
        ignoreDashboardClickEvent={(e) => page.isMapToggleElement(e.target)}
      />
      )
      await awaitElementById(container.id)
      return
    }
  }
}
RunUserscripts(realestateSites.map(toUserscript))