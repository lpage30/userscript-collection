// @grant       GM_openInTab
import React from "react";
import { Button } from "primereact/button";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import { Persistence } from "../dashboardcomponents/persistence";
import { Post, sortingFields, filterableItems, toPostCard } from "./posts";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../common/await_functions";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../common/ui/renderRenderable";
import Dashboard from "../dashboardcomponents/Dashboard";
import { layoffBaseUrl } from "./FavoriteCompanyLayoffs";
import { FavoriteCompanyList, loadPosts } from "./FavoriteCompanyLayoffs";

const renderableId = "the-layoff-dashboard-panel";

async function loadFavoritesDashboard(force: boolean): Promise<Post[]> {
  const favoriteMaps = await Promise.all(FavoriteCompanyList.map(({ name }) => loadPosts(name, force)))
  return Object.values(favoriteMaps.reduce((result, favoriteMap) => ({
    ...result,
    ...favoriteMap,
  }), {})).flat().map(toPostCard)

}

export const TheLayoffDashboard: Userscript = {
  name: "TheLayoffDashboard",

  isSupported: (href: string): boolean => href === `${layoffBaseUrl}/`,

  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    const navBarElement = document.getElementById('navbar')
    if (navBarElement) {
      navBarElement.style.display = 'none'
    }

    const persistence = Persistence('TheLayoff', filterableItems)
    let cards = await loadFavoritesDashboard(false)

    const container = createRenderableContainerAsChild(
      document.body,
      renderableId
    )
    let refreshCards: () => void | null = null

    const loadAndRefreshContent = async () => {
      cards = await loadFavoritesDashboard(true)
      if (refreshCards) refreshCards()
    }
    const getCards = () => {
      return cards
    }
    renderInContainer(container, <Dashboard
      title={`Company Favorites`}
      persistence={persistence}
      pageTypes={['dashboard']}
      filterableItems={filterableItems}
      sortingFields={sortingFields}
      page={'dashboard'}
      getCards={getCards}
      layout={'vertical'}
      registerRefreshContent={(refreshContent) => { refreshCards = refreshContent }}
      addedHeaderComponent={
        <Button
          className="app-button"
          onClick={() => loadAndRefreshContent()}
        >Refresh Cards</Button>
      }

    />);
    await awaitElementById(renderableId);

  },
}
