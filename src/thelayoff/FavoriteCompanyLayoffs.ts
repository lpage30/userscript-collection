// @grant       GM_setValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
// @grant       GM_openInTab
import { Post } from "./posts"
import { Persistence, StaleDuration } from "../dashboardcomponents/persistence"

interface LayoffCompanyInfo {
    name: string,
    urlpath: string
}
export const layoffBaseUrl = 'https://www.thelayoff.com'
const FavoriteCompanyInfoList = [
    {
        name: 'Top25',
        urlpath: 'last-25.php'
    },
    {
        name: 'Optum',
        urlpath: 'optum'
    },
    {
        name: 'UnitedHealth Group',
        urlpath: 'unitedhealth-group'
    },
    {
        name: 'Amazon',
        urlpath: 'amazon-com'
    },
    {
        name: 'Cisco',
        urlpath: 'cisco-systems'
    },
    {
        name: 'Cimpress',
        urlpath: 'cimpress'
    },
    {
        name: 'Microsoft',
        urlpath: 'cisco-systems'
    },
    {
        name: 'Dell',
        urlpath: 'dell'
    },
    {
        name: 'Dell-EMC',
        urlpath: 'emc'
    },
]
export interface CompanyLayoffInfo {
    name: string,
    url: string,
    activeUrl: string,
}
export const FavoriteCompanyList: CompanyLayoffInfo[] = FavoriteCompanyInfoList.map(item => {
    const url = `${layoffBaseUrl}/${item.urlpath}`
    const activeUrl = item.urlpath.endsWith('.php')? url : `${url}?sort=active`
    return {
        name: item.name,
        url,
        activeUrl
    }
})

export async function loadPosts(favoriteName: string, force: boolean): Promise<{ [favoriteName: string]: Post[] }> {
    const persistence = Persistence(favoriteName)
    if (!force) {
        const existingCards = persistence.loadDashboard<Post>(Date.now() - StaleDuration)
        if (existingCards) {
            return { [favoriteName]: existingCards }
        }
    }
    const pendingCards = persistence.awaitDashboard<Post>()        
    const tab = GM_openInTab(FavoriteCompanyList[favoriteName].activeUrl, { active: false})
    const scrapedCards = await pendingCards
    if (tab && !tab.closed) {
        tab.close()
    }
    return { [favoriteName]: scrapedCards ?? [] }
}