import React from "react";
import "../../common/ui/styles.scss";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../../common/await_functions";
import { statusElementId, processCompanyStatus, sortingFields, filterableItems, CompanyPageTypes } from "../common/CompanyTypes";
import { Persistence } from "../../dashboardcomponents/persistence";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import CompanyStatus from "./CompanyStatus";

export const DownDetectorCompanyStatus: Userscript = {
  name: "DownDetectorCompanyStatus",
  containerId: 'downdetector-company-status-panel',
  isSupported: (href: string): boolean =>
    href.includes("downdetector.com/status/") && !href.endsWith('/map/'),
  preparePage: (href: string): Promise<void> => awaitPageLoadByMutation(),
  createContainer: async (href: string): Promise<HTMLElement> => {
    return createRenderableContainerAsChild(
      document.body,
      DownDetectorCompanyStatus.containerId,
    );
  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const persistence = Persistence('DownDetector', () => filterableItems)
    const status = processCompanyStatus('status',
      await awaitElementById(statusElementId),
      href,
      persistence,
    );
    renderInContainer(container, <CompanyStatus
      persistence={persistence}
      pageTypes={[...CompanyPageTypes]}
      filterableItems={filterableItems}
      sortingFields={sortingFields}
      company={status}
      page={'status'}
    />);
    await awaitElementById(container.id);
  },
};
