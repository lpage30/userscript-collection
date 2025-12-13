// @grant       GM_openInTab
import React from "react";
import { Button } from "primereact/button";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import { Persistence } from "../dashboardcomponents/persistence";
import { sortingFields, getFilterableItems } from "./posts";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../common/await_functions";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../common/ui/renderRenderable";
import { LoadingPopup } from "../common/ui/LoadingPopup";
import Dashboard from "../dashboardcomponents/Dashboard";
import { layoffBaseUrl } from "./bookmarkedCompanies";
import { loadPosts, getCompanyBookmarks } from "./bookmarkedCompanies";

export const TheLayoffDashboard: Userscript = {
  name: "TheLayoffDashboard",
  containerId: 'the-layoff-dashboard-panel',
  isSupported: (href: string): boolean => href === `${layoffBaseUrl}/` || href.startsWith(`${layoffBaseUrl}/#`),
  preparePage: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    const navBarElement = document.getElementById('navbar')
    if (navBarElement) {
      navBarElement.style.display = 'none'
    }

  },
  createContainer: async (href: string): Promise<HTMLElement> => {
    return createRenderableContainerAsChild(
      document.body,
      TheLayoffDashboard.containerId
    )

  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    let refreshCards: () => void | null = null
    let persistence = Persistence('TheLayoff', getFilterableItems)

    const loadAndRefreshContent = async () => {
      cards = await loadPosts(true)
      persistence = Persistence('TheLayoff', getFilterableItems)
      if (refreshCards) refreshCards()
    }
    const getCards = () => {
      return cards
    }
    const getPersistence = () => {
      return persistence
    }

    renderInContainer(container, <LoadingPopup
      isOpen={true}
      message={`Loading ${getCompanyBookmarks().length} Company Bookmarks...`}
    />);
    let cards = await loadPosts(false)
    container.innerHTML = ""
    renderInContainer(container, <Dashboard
      title={`Company Bookmarks`}
      getPersistence={getPersistence}
      pageTypes={['dashboard']}
      getFilterableItems={getFilterableItems}
      sortingFields={sortingFields}
      page={'dashboard'}
      getCards={getCards}
      layout={'vertical'}
      registerRefreshContent={(refreshContent) => { refreshCards = refreshContent }}
      addedHeaderComponent={{
        after: 'picklist',
        element: <Button
          className="app-button"
          onClick={() => loadAndRefreshContent()}
        >Refresh Cards</Button>
      }}

    />);
    await awaitElementById(container.id);
  },
}
