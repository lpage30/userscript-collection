import React from "react";
import "../../common/ui/styles.scss";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../../common/await_functions";
import { sortingFields, filterableItems, CompanyPageTypes } from "../common/CompanyTypes";
import { statusMapElementId, processCompanyStatus } from "../common/CompanyTypes_functions"
import { Persistence } from "../../dashboardcomponents/persistence";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import CompanyStatus from "./CompanyStatus";


export const DownDetectorCompanyStatusMap: Userscript = {
  name: "DownDetectorCompanyStatusMap",
  containerId: 'downdetector-company-status-map-panel',
  isSupported: (href: string): boolean => href.includes("downdetector.com/status/") && href.endsWith('/map/'),
  preparePage: (href: string): Promise<void> => awaitPageLoadByMutation(),
  cleanupContainers: async (href: string): Promise<boolean> => {
    let result = false
    const ids: string[] = [DownDetectorCompanyStatusMap.containerId]
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
    return createRenderableContainerAsChild(
      document.body,
      DownDetectorCompanyStatusMap.containerId,
    );
  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const persistence = Persistence('DownDetector', () => filterableItems)
    const status = processCompanyStatus('map',
      await awaitElementById(statusMapElementId),
      href,
      persistence
    );
    renderInContainer(container, <CompanyStatus
      persistence={persistence}
      pageTypes={[...CompanyPageTypes]}
      filterableItems={filterableItems}
      sortingFields={sortingFields}
      company={status}
      page={'map'}
    />);
    await awaitElementById(container.id);
  },
};
