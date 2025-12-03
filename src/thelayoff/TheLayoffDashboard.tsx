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
import Dashboard from "../dashboardcomponents/Dashboard";
import { layoffBaseUrl } from "./bookmarkedCompanies";
import { loadPosts } from "./bookmarkedCompanies";

const renderableId = "the-layoff-dashboard-panel";

export const TheLayoffDashboard: Userscript = {
  name: "TheLayoffDashboard",

  isSupported: (href: string): boolean => href === `${layoffBaseUrl}/`,

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    const navBarElement = document.getElementById('navbar')
    if (navBarElement) {
      navBarElement.style.display = 'none'
    }

    let persistence = Persistence('TheLayoff', getFilterableItems())
    let cards = await loadPosts(false)

    const container = createRenderableContainerAsChild(
      document.body,
      renderableId
    )
    let refreshCards: () => void | null = null

    const loadAndRefreshContent = async () => {
      cards = await loadPosts(true)
      persistence = Persistence('TheLayoff', getFilterableItems())
      if (refreshCards) refreshCards()
    }
    const getCards = () => {
      return cards
    }
    const getPersistence = () => {
      return persistence
    }
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
    await awaitElementById(renderableId);

  },
}
