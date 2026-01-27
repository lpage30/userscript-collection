import './registergeocoding'
import React from "react";
import "../common/ui/styles.scss";
import { Userscript, RunUserscripts } from "../common/userscript";
import { RealEstateSite, PropertyPageType, propertyPageTypeString, GeocodedScrapedProperties, ScrapedProperties } from "./realestatesitetypes";
import { RedfinSite } from "./redfin/redfin_site";
import { RealtorSite } from "./realtor/realtor_site";
import { ZooplaSite } from "./zoopla/zoopla_site";
import { awaitDelay, awaitElementById } from "../common/await_functions";
import { LoadingPopup } from "../common/ui/LoadingPopup";
import {
  renderInContainer,
} from "../common/ui/renderRenderable";
import { RealestateControlPanel } from "./RealestateControlPanel";
import { getMaximumZIndex } from '../common/ui/style_functions';
import { toDurationString } from '../common/datetime';
import { cacheProperties, cacheWrapper } from './propertyinfocache';
import { PropertyInfo } from './propertyinfotypes';
import { geocodePropertyInfoCard, toPropertyInfoCard } from './propertyinfotype_functions';

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
      container.style.zIndex = `${getMaximumZIndex() + 1}`
      container.style.position = 'absolute'
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
      const tstartLoad = Date.now()
      const onCancelLoading = () => {
        renderInContainer(container, undefined)
      }

      renderInContainer(container, <LoadingPopup
        message={`Userscript Loading ${site.name} ${propertyPageTypeString(page.pageType)}...`}
        isOpen={true}
        onCancel={onCancelLoading}
      />);

      const toggleMaps = async (parentElement?: HTMLElement) => {
        (await page.getMapToggleElements(parentElement)).forEach(element => element.click())
      }
      await awaitDelay(1000)
      const reportProgress = (progress: string) => {
        console.log(`Progress: ${progress}`)
      }
      const loadProperties = (force: boolean, includeOlderResults?: boolean): Promise<GeocodedScrapedProperties> => {
        const collectData = async (): Promise<GeocodedScrapedProperties> => {
          const scrapedProperties: ScrapedProperties = page.scrapePage(reportProgress, includeOlderResults)
          const properties: PropertyInfo[] = []
          for (const property of scrapedProperties.properties) {
            if (isNaN(property.Price)) {
              reportProgress(`Skipping, Price is missing or invalid. ${property.source}-${property.address}`)
              continue
            }
            properties.push(await geocodePropertyInfoCard(toPropertyInfoCard(property), reportProgress))
          }
          return {
            properties,
            containsOlderResults: scrapedProperties.containsOlderResults
          }
        }
        return cacheWrapper(site.name, href, collectData, force)
      }

      const geocodedScrapedProperties = await loadProperties(false)
      console.log(`${site.name} ${propertyPageTypeString(page.pageType)} ${geocodedScrapedProperties.properties.length} properties: ${toDurationString(Date.now() - tstartLoad)}`)
      const title = `${site.name} (${geocodedScrapedProperties.properties[0].country}) ${propertyPageTypeString(page.pageType)}${PropertyPageType.Single === page.pageType ? ` ${geocodedScrapedProperties.properties[0].address}` : ''}`
      renderInContainer(container, <RealestateControlPanel
        id={renderableId}
        siteName={site.name}
        title={title}
        toggleMapDisplay={toggleMaps}
        geocodedScrapedProperties={geocodedScrapedProperties}
        containsOlderResults={page.containsOlderResults}
        loadProperties={loadProperties}
      />
      )
      await awaitElementById(container.id)
      return
    }
  }
}
RunUserscripts(realestateSites.map(toUserscript))