import React from "react";
import "../../common/ui/styles.css";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitQueryAll,
  awaitElementById,
} from "../../common/await_functions";
import { CompanyPageTypes, sortingFields, filterableItems, dashboardCardsQueryAllSelector, processCompanyDashboardCards } from "../common/CompanyTypes";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import Dashboard from "../../dashboardcomponents/Dashboard";
import { Persistence } from "../../dashboardcomponents/persistence";

const renderableId = "downdetector-dashboard-panel";
export const DownDetectorDashboard: Userscript = {
  name: "DownDetectorDashboard",

  isSupported: (href: string): boolean => href.endsWith("downdetector.com/"),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    const persistence = Persistence('DownDetector', filterableItems)
    const cards = processCompanyDashboardCards(
      await awaitQueryAll(dashboardCardsQueryAllSelector),
      persistence
    );
    const container = createRenderableContainerAsChild(
      document.body,
      renderableId,
    );

    renderInContainer(container, <Dashboard 
      title={`DownDetector Dashboard's Top ${cards.length}`}
      persistence={persistence}
      pageTypes={[...CompanyPageTypes]}
      filterableItems={filterableItems}
      sortingFields={sortingFields}
      page={'dashboard'}
      cards={cards}
      layout={'grid'}
    />);
    await awaitElementById(renderableId);
  },
};
