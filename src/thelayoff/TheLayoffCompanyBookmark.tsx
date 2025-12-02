import React, { useState } from "react";
import { Button } from "primereact/button";
import { layoffBaseUrl, Bookmark, getCompanyBookmarks, setBookmarkList } from "./bookmarkedCompanies";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import {
  awaitPageLoadByMutation,
  awaitElementById,
} from "../common/await_functions";
import { toTitleCase } from "../common/functions";
import {
  createRenderableContainerAsChild,
  renderInContainer,
} from "../common/ui/renderRenderable";

const BookmarkButtons: React.FC<{bookmark: Bookmark} > = ({
  bookmark
}) => {
  const [add, setAdd] = useState<boolean>(undefined === getCompanyBookmarks().find(({urlpath}) => urlpath === bookmark.urlpath))
  const addRemoveBookmark = () => {
    let bookmarks: Bookmark[] = getCompanyBookmarks()
    if (add) {
      bookmarks.push(bookmark)
    } else {
      bookmarks = bookmarks.filter(({urlpath}) => urlpath !== bookmark.urlpath)
    }
    setBookmarkList(bookmarks)
    setAdd(!add)
  }
  const openDashboard = () => {
    window.open(`${layoffBaseUrl}/`, '_self')
  }
  return <div style={{ display: 'flex' }}>
    <Button
      className="app-button"
      style={{ backgroundColor: 'green', color: 'white', borderColor: 'blue'}}
      onClick={openDashboard}
    >Open Bookmark Dashboard</Button>
    <Button
      className="app-button"
      style={{ backgroundColor: add ? 'green' : 'red', color: add ? 'white' : 'black', borderColor: 'blue'}}
      onClick={addRemoveBookmark}
    >{`${add ? 'Bookmark' : 'Unbookmark'} ${bookmark.name}`}</Button>
  </div>
  

}
const renderableId = "the-layoff-bookmark-button";
export const TheLayoffCompanyBookmark: Userscript = {
  name: "TheLayoffCompanyBookmark",

  isSupported: (href: string): boolean => href.startsWith(`${layoffBaseUrl}/`) && !href.includes('#') && (layoffBaseUrl.length + 1) < href.length,

  render: async (href: string): Promise<void> => {
    const urlpath = (new URL(href)).pathname.slice(1)
    const bookmark: Bookmark = {
      name: toTitleCase(urlpath.replace(/-/g,' ')),
      urlpath
    }
    await awaitPageLoadByMutation();
    const navBarElement = document.getElementById('navbar')
    if (navBarElement) {
      navBarElement.style.display = 'none'
    }
    const parentElement = document.getElementById('page-body')
    const afterElement = document.getElementById('searchbox')

    const container = createRenderableContainerAsChild(
      parentElement,
      renderableId, {
        after: afterElement
      }
    )
    renderInContainer(container, <BookmarkButtons bookmark={bookmark}/>)
    await awaitElementById(renderableId);
  }
}