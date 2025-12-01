import React from "react";
import "../../common/ui/styles.css";
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
import Dashboard from "../../dashboardcomponents/Dashboard";
import { Persistence } from "../../dashboardcomponents/persistence";
import { ServiceDashboardPopupAndSummary } from "../../statusAPIs/ui/ServiceDashboard";
import { ServiceStatus } from "../../statusAPIs/statustypes";
import { setServiceStatus, getDependentServiceStatuses } from "../../statusAPIs/servicestatuscache";
import { reactToHTMLString } from "../../common/ui/reactTrustedHtmlString";
import { sortServiceByIndicatorRank } from "../../statusAPIs/ui/IndicatorStatusTypeInfoMaps";
import { ServiceHealthStatusSpan } from "../../statusAPIs/ui/IndicatorStatusComponents";

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

    const onServiceStatus = (serviceStatus: ServiceStatus[]) => {
      setServiceStatus(serviceStatus)

      cards.forEach(card => {
        const serviceStatuses = getDependentServiceStatuses(card.companyName)
        if (serviceStatuses) {
          const renderable = (
            <>
              <div 
                className="text-sm" 
                style={{ paddingLeft: `0px`, paddingRight: `3px`}}
              >Dependent Services</div>
              {serviceStatuses
                .sort(sortServiceByIndicatorRank)
                .map(status => (ServiceHealthStatusSpan(status,0, 3, true)))
              }
            </>
          )
          card.renderable.firstElementChild.innerHTML = reactToHTMLString(renderable)
        }
      })
    }

    renderInContainer(container, <Dashboard 
      title={`DownDetector Dashboard's Top ${cards.length}`}
      persistence={persistence}
      pageTypes={[...CompanyPageTypes]}
      filterableItems={filterableItems}
      sortingFields={sortingFields}
      page={'dashboard'}
      cards={() => cards}
      layout={'grid'}
      addedHeaderComponent={<ServiceDashboardPopupAndSummary 
          onServiceStatus={onServiceStatus}
          companyHealthStatuses={cards.map(({companyName, level}) => ({ companyName, healthStatus: level }))}
        />}
    />);
    await awaitElementById(renderableId);
  },
};
