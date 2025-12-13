import React from "react";
import "../../common/ui/styles.css";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../../common/await_functions";
import { statusMapElementId, processCompanyStatus, sortingFields, filterableItems, CompanyPageTypes } from "../common/CompanyTypes";
import { Persistence } from "../../dashboardcomponents/persistence";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import CompanyStatus from "./CompanyStatus";


export const DownDetectorCompanyStatusMap: Userscript = {
  name: "DownDetectorCompanyStatusMap",
  containerId: 'downdetector-company-status-map-panel',

  isSupported: (href: string): boolean =>
    href.includes("downdetector.com/status/") && href.endsWith('/map/'),
  preparePage: (href: string): Promise<void> => awaitPageLoadByMutation(),
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
