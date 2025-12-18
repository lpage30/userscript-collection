import React from "react";
import "../common/ui/styles.scss";
import { Userscript, RunUserscripts } from "../common/userscript";
import { RealEstateSite } from "./realestate_site";
import { RedfinSite } from "./redfin/redfin_site";
import { RealtorSite } from "./realtor/realtor_site";
import { awaitPageLoadByMutation, awaitElementById } from "../common/await_functions";
import {
  renderInContainer,
} from "../common/ui/renderRenderable";
import { PropertyInfo } from "./realestate_site";
import { RealestateControlPanel } from "./RealestateControlPanel";

const realestateSites: RealEstateSite[] = [
  RedfinSite,
  RealtorSite
];

export function toUserscript(site: RealEstateSite): Userscript {
  return {
    name: site.name,
    containerId: site.containerId,
    isSupported: (href: string): boolean => site.isSupported(href),
    preparePage: async (href: string): Promise<void> => {
      await awaitPageLoadByMutation()
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
      if (site.feedPage && site.feedPage.isFeedPage(href)) {
        site.feedPage.insertContainerOnFeedPage(container)
      }
      if (site.listingPage.isListingPage(href)) {
        site.listingPage.insertContainerOnListingPage(container)
      }
      if (site.singlePropertyPage.isSinglePropertyPage(href)) {
        site.singlePropertyPage.insertContainerOnSinglePropertyPage(container)
      }
      return container
    },

    renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
      const renderableId = `${container.id}-panel`
      if (site.feedPage && site.feedPage.isFeedPage(href)) {
        const toggleMaps = async () => {
          (await site.feedPage.getFeedPageMapToggleButtons()).forEach(button => button.click())
        }
        renderInContainer(container, <RealestateControlPanel
          id={renderableId}
          toggleMapDisplay={toggleMaps} />
        )
        await awaitElementById(container.id)
        return
      }
      if (site.listingPage.isListingPage(href)) {
        const toggleMaps = async () => {
          (await site.listingPage.getListingPageMapToggleElement()).click()
        }
        renderInContainer(container, <RealestateControlPanel
          id={renderableId}
          toggleMapDisplay={toggleMaps} />
        )
        await awaitElementById(container.id)
        return

      }
      if (site.singlePropertyPage.isSinglePropertyPage(href)) {
        const info: PropertyInfo = await site.singlePropertyPage.scrapeSinglePropertyPage()
        const toggleMaps = async () => {
          const e = await site.singlePropertyPage.getSinglePageMapToggleElement()
          e.click()
        }
        renderInContainer(container, <RealestateControlPanel
          id={renderableId}
          toggleMapDisplay={toggleMaps}
          propertyInfo={info}
        />

        )
        await awaitElementById(container.id)
        return
      }
    },
  }
}
RunUserscripts(realestateSites.map(toUserscript))