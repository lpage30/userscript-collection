import React from "react";
import "../../common/ui/styles.css";
import { Userscript } from "../../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitQueryAll,
  awaitElementById,
} from "../../common/await_functions";
import { dashboardCardsQueryAllSelector, processCompanyDashboardCards } from "../common/CompanyTypes";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../../common/ui/renderRenderable";
import CompanyDashboard from "./CompanyDashboard";

const renderableId = "downdetector-dashboard-panel";
export const DownDetectorDashboard: Userscript = {
  name: "DownDetectorDashboard",

  isSupported: (href: string): boolean => href.endsWith("downdetector.com/"),

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    const cards = processCompanyDashboardCards(
      await awaitQueryAll(dashboardCardsQueryAllSelector),
    );
    const container = createRenderableContainerAsChild(
      document.body,
      renderableId,
    );
    renderInContainer(container, <CompanyDashboard page={'dashboard'} companies={cards} />);
    await awaitElementById(renderableId);
  },
};
