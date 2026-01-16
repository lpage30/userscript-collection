import React from "react";
import "../../common/ui/styles.scss";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitQueryAll,
  awaitElementById,
} from "../../common/await_functions";
import {
  CompanyPageTypes,
  sortingFields,
  filterableItems,
  dashboardCardsQueryAllSelector,
  processCompanyDashboardCards,
} from "../common/CompanyTypes";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import { LoadingPopup } from "../../common/ui/LoadingPopup";
import Dashboard from "../../dashboardcomponents/Dashboard";
import { Persistence } from "../../dashboardcomponents/persistence";
import { createOnExternalDataUpdates } from "../common/onexternaldataupdate";
import { ServiceDashboardPopupAndSummary } from "../../statusAPIs/ui/ServiceDashboard";
import { LoadOutageBreakdowns } from "../../geoblackout/ui/LoadOutageBreakdowns";

export const DownDetectorDashboard: Userscript = {
  name: "DownDetectorDashboard",
  containerId: 'downdetector-dashboard-panel',
  isSupported: (href: string): boolean => href.endsWith("downdetector.com/"),
  preparePage: (href: string): Promise<void> => awaitPageLoadByMutation(),
  cleanupContainers: async (href: string): Promise<boolean> => {
    let result = false
    const ids: string[] = [DownDetectorDashboard.containerId]
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
      DownDetectorDashboard.containerId,
    );
  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    renderInContainer(container, <LoadingPopup
      isOpen={true}
    />);
    const persistence = Persistence('DownDetector', () => filterableItems)
    const cards = processCompanyDashboardCards(
      await awaitQueryAll(dashboardCardsQueryAllSelector),
      persistence
    );
    const { onServiceStatus, onOutageBreakdowns } = createOnExternalDataUpdates(cards, persistence)

    container.innerHTML = ""
    renderInContainer(container, <Dashboard
      title={`DownDetector Dashboard's Top ${cards.length}`}
      getPersistence={() => persistence}
      pageTypes={[...CompanyPageTypes]}
      getFilterableItems={() => filterableItems}
      sortingFields={sortingFields}
      page={'dashboard'}
      getCards={() => cards}
      layout={'grid'}
      cardStyle={{
        borderTop: '1px solid #ddd',
        borderLeft: '1px solid #ddd',
        borderRight: '2px solid #bbb',
        borderBottom: '2px solid #bbb;',
        backgroundColor: '#fcfcfc',
      }}
      addedHeaderComponents={[
        {
          after: 'lastrow',
          element: <LoadOutageBreakdowns
            onOutageBreakdowns={onOutageBreakdowns}
          />
        },
        {
          after: 'lastrow',
          element: <ServiceDashboardPopupAndSummary
            onServiceStatus={onServiceStatus}
            companyHealthStatuses={cards.map(({ companyName, level }) => ({ companyName, healthStatus: level }))}
          />
        },
      ]}
    />);
    await awaitElementById(container.id);
  },
};
