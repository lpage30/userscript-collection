// @grant       GM_openInTab
import React from "react";
import { Button } from "primereact/button";
import "../common/ui/styles.scss";
import { Userscript } from "../common/userscript";
import { Persistence } from "../dashboardcomponents/persistence";
import { Post } from "./posts";
import { sortingFields, getFilterableItems } from './posts_functions'
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
import { Card } from "../dashboardcomponents/datatypes";
import { toPostCardComponent } from "./PostCardComponent";

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
  cleanupContainers: async (href: string): Promise<boolean> => {
    let result = false
    const ids: string[] = [TheLayoffDashboard.containerId]
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
      TheLayoffDashboard.containerId
    )

  },
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    let cards: Post[] = []
    let refreshCards: () => void | null = null

    const getCompanyNames = () => {
      const bookmarkedNames = getCompanyBookmarks().map(({ name }) => name)
      const currentCardNames = getCards().map(({ company }) => company)
      return [...bookmarkedNames, ...currentCardNames]
        .sort()
        .filter((name, index, array) => index === 0 || array[index - 1] !== name)
    }

    const loadAndRefreshContent = async () => {
      cards = await loadPosts(true)
      if (refreshCards) refreshCards()
    }
    const getCards = () => {
      return cards
    }
    const getPersistence = () => {
      return Persistence('TheLayoff', () => getFilterableItems(getCompanyNames))
    }
    const onCancelLoading = () => {
      renderInContainer(container, undefined)
    }

    renderInContainer(container, <LoadingPopup
      isOpen={true}
      message={`Loading ${getCompanyBookmarks().length} Company Bookmarks...`}
      onCancel={onCancelLoading}
    />);
    cards = await loadPosts(false)
    container.innerHTML = ""
    renderInContainer(container, <Dashboard
      title={`Company Bookmarks`}
      getPersistence={getPersistence}
      pageTypes={['dashboard']}
      getFilterableItems={() => getFilterableItems(getCompanyNames)}
      sortingFields={sortingFields}
      page={'dashboard'}
      getCards={getCards}
      toCardComponent={toPostCardComponent}
      layout={'vertical'}
      registerRefreshContent={(refreshContent) => { refreshCards = refreshContent }}
      addedHeaderComponents={[{
        after: 'picklist',
        element: <Button
          className="app-button"
          onClick={() => loadAndRefreshContent()}
        >Refresh Cards</Button>
      }]}
      infoDisplayRowSpan={2}

    />);
    await awaitElementById(container.id);
  },
}
