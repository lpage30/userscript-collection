// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_openInTab
import { Post, toPostCard } from "./posts"
import { Persistence, StaleDuration } from "../dashboardcomponents/persistence"

const bookmarkedListVariableName = 'BookmarkedList'
export interface Bookmark {
    name: string,
    urlpath: string
}
export interface CompanyBookmark extends Bookmark {
    name: string,
    url: string,
    activeUrl: string,
}
export const layoffBaseUrl = 'https://www.thelayoff.com'
const DefaultBookmarkList = [
    {
        name: 'Top25',
        urlpath: 'last-25.php'
    }
]

export function setBookmarkList(bookmarks: Bookmark[]) {
    GM_setValue(bookmarkedListVariableName, JSON.stringify(bookmarks))
}

export function getCompanyBookmarks(): CompanyBookmark[] {
    const jsonString = GM_getValue(bookmarkedListVariableName, null)
    if (jsonString === null) {
        setBookmarkList(DefaultBookmarkList)
        return getCompanyBookmarks()
    }
    const bookmarks: Bookmark[] = JSON.parse(jsonString)
    return bookmarks.map(item => {
        const url = `${layoffBaseUrl}/${item.urlpath}`
        const activeUrl = item.urlpath.endsWith('.php')? url : `${url}?sort=active`
        return {
            ...item,
            url,
            activeUrl
        } as CompanyBookmark
    })
}
async function loadCompanyPosts(favorite: CompanyBookmark, force: boolean): Promise<Post[]> {
    const persistence = Persistence(favorite.name)
    if (!force) {
        const existingCards = persistence.loadDashboard<Post>(Date.now() - StaleDuration)
        if (existingCards) {
            return existingCards
        }
    }
    const pendingCards = persistence.awaitDashboard<Post>()        
    const tab = GM_openInTab(favorite.activeUrl, { active: false})
    const scrapedCards = await pendingCards
    if (tab && !tab.closed) {
        tab.close()
    }
    return scrapedCards ?? []    
}
const comparePosts = (l: Post, r: Post) => {
    let result = l.company.localeCompare(r.company)
    if (0 === result) {
        result = l.title.localeCompare(r.title)
    }
    return result
}
export async function loadPosts(force: boolean): Promise<Post[]> {
  return (await Promise.all(getCompanyBookmarks().map(company => loadCompanyPosts(company, force))))
    .flat()
    .map(toPostCard)
    .sort(comparePosts)
    .filter((post, index, array) => 0 === index || (0 !== comparePosts(array[index - 1], post)))

}

