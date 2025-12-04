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
import { LoadingPopup } from "../../common/ui/LoadingPopup";
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

    const persistence = Persistence('DownDetector', () => filterableItems)
    renderInContainer(container, <LoadingPopup 
      isOpen={true}
    />);
    const cards = processCompanyDashboardCards(
      await awaitQueryAll(dashboardCardsQueryAllSelector),
      persistence
    );
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
      addedHeaderComponent={{
        after: 'lastrow',
        element: <ServiceDashboardPopupAndSummary 
          onServiceStatus={onServiceStatus}
          companyHealthStatuses={cards.map(({companyName, level}) => ({ companyName, healthStatus: level }))}
        />
      }}
    />);
    await awaitElementById(renderableId);
  },
};
