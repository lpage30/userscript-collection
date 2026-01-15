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
import { ServiceStatus } from "../../statusAPIs/statustypes";
import { setServiceStatus, getDependentServiceStatuses } from "../../statusAPIs/servicestatuscache";
import { reactToHTMLString } from "../../common/ui/reactTrustedHtmlString";
import { DependentServiceListingComponent } from "../../statusAPIs/ui/DependentServiceListing";
import {
  OutageBreakdown,
  CompanyOutageBreakdownMap,
  mapCompanyToOutageBreakdown,
  breakdownDataToString
} from "../../geoblackout/outageBreakdownAPItypes";
import { OutageBreakdownComponent } from "../../geoblackout/ui/OutageBreakdown";
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
    const onServiceStatus = (serviceStatus: ServiceStatus[]) => {
      setServiceStatus(serviceStatus)

      cards.forEach(card => {
        const serviceStatuses = getDependentServiceStatuses(card.companyName)
        if (serviceStatuses) {
          card.renderable.firstElementChild.innerHTML = reactToHTMLString(
            <DependentServiceListingComponent serviceStatuses={serviceStatuses} />
          )
        }
      })
    }
    const onOutageBreakdowns = (serviceOutages: OutageBreakdown[]) => {
      const companyServiceMap: CompanyOutageBreakdownMap = mapCompanyToOutageBreakdown(
        cards.map(({ companyName }) => companyName),
        serviceOutages
      )
      let outageMatchCount = 0
      cards.forEach(card => {
        const service: OutageBreakdown | undefined = companyServiceMap[card.companyName]
        if (service) {
          outageMatchCount = outageMatchCount + 1
          card.displayLinesArray = [
            `${card.companyName}`,
            ...service.data.map(breakdownDataToString)
          ]
          card.displayLines = () => card.displayLinesArray
          card.renderable.lastElementChild.innerHTML = reactToHTMLString(
            <OutageBreakdownComponent service={service} />
          )
          delete companyServiceMap[card.companyName]
        }
      })
      if (outageMatchCount < serviceOutages.length) {
        const missedServices = Object.values(companyServiceMap).map(({ service }) => service)
        console.log(`onOutageBreakdowns> ${outageMatchCount}/${serviceOutages.length} matched. Unmatched OutageBreakdowns: [${missedServices.join(',')}`)
      }
      if (0 < outageMatchCount) {
        persistence.storeDashboard(Date.now(), cards)
      }

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
          element: <ServiceDashboardPopupAndSummary
            onServiceStatus={onServiceStatus}
            companyHealthStatuses={cards.map(({ companyName, level }) => ({ companyName, healthStatus: level }))}
          />
        },
        {
          after: 'lastrow',
          element: <LoadOutageBreakdowns
            onOutageBreakdowns={onOutageBreakdowns}
          />
        },
      ]}
    />);
    await awaitElementById(container.id);
  },
};
