import React from "react";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import { Persistence } from "../dashboardcomponents/persistence";
import { sortingFields, filterableItems, scrapePosts, PageTypes, theLayoffBaseUrl, getPageType } from "./posts";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../common/await_functions";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../common/ui/renderRenderable";
import Dashboard from "../dashboardcomponents/Dashboard";
import { FilterableItems, ItemFilter } from "../dashboardcomponents/datatypes";

const renderableId = "the-layoff-dashboard-panel";

export const TheLayoffDashboard: Userscript = {
  name: "TheLayoffDashboard",

  isSupported: (href: string): boolean => href.startsWith(theLayoffBaseUrl) && href.trim().length > theLayoffBaseUrl.length,
  
  render: async (href: string): Promise<void> => {
    await awaitPageLoadByMutation();
    const navBarElement = document.getElementById('navbar')
    if (navBarElement) {
      navBarElement.style.display = 'none'
    }
    const pagetype = getPageType(href)
    const persistence = Persistence('TheLayoff', filterableItems)
    const cards = scrapePosts(pagetype)
    const container = createRenderableContainerAsChild(
      document.body,
      renderableId
    )
    const getTitle = () => {
      switch(pagetype) {
        case 'last25':
          return 'TheLayoff: Last 25 Replies'
        case 'company':
          return `TheLayoff: ${cards[0].company}`
        default:
          return 'The Layoff'

      }
    }
    const getFilterableItems = (): FilterableItems => {
      if (pagetype !== 'last25') return filterableItems
      const companies = cards.map(({company}) => company).sort().filter((company, index, companies) => index === 0 || companies[index - 1] !== company)
      return { company: {
        field: 'company',
        filter: companies.reduce((result, company) => ({
          ...result,
          [company]: true
        }), {})
      } as ItemFilter }
    }

    renderInContainer(container, <Dashboard 
      title={getTitle()}
      persistence={persistence}
      pageTypes={PageTypes}
      filterableItems={getFilterableItems()}
      sortingFields={sortingFields}
      page={pagetype}
      cards={cards}
    />);
    await awaitElementById(renderableId);

  },
}
