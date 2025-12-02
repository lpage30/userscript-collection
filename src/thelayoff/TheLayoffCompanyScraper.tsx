import React from "react";
import { CompanyBookmark, getCompanyBookmarks } from "./bookmarkedCompanies";
import "../common/ui/styles.css";
import { Userscript } from "../common/userscript";
import { Persistence } from "../dashboardcomponents/persistence";
import {
  awaitPageLoadByMutation,
} from "../common/await_functions";
import { Post, toPostCard } from "./posts";
import { toTitleCase } from "../common/functions";
import { parseDateTime } from "../common/datetime";

function parseRepliesText(replyText: string): { replyCount: number, lastReply: Date } | undefined {
  const regex = new RegExp(/^(\d+)[^\(]*\(([^\)]*)\).*$/g)
  const result = regex.exec(replyText.split('\n')[0])
  if (null === result) return undefined
  return {
    replyCount: parseInt(result[1]),
    lastReply: parseDateTime(result[2])
  }
}
function scrapePosts(companyBookmark: CompanyBookmark): Post[] {
  const isTop25 = companyBookmark.name === 'Top25'
  return Array.from(document.getElementById('posts').querySelectorAll('article')).map(postElement => {
    const firstChild = postElement.firstElementChild as HTMLElement
    if (firstChild.tagName !== 'HEADER') {
      firstChild.style.display = 'none'
    }
    const header = postElement.querySelector('header')
    const footer = postElement.querySelector('footer')
    const footerParts = footer.innerText.split('|').map(t => t.trim())
    const companyHref = isTop25
        ? Array.from(footer.querySelectorAll('a')).slice(-1)[0].href
        : window.location.href
    const company = toTitleCase((new URL(companyHref)).pathname.replace(/\//g, '').replace(/-/g, ' '))

    const date = parseDateTime(footerParts[0]) ?? new Date()
    const { replyCount, lastReply } = parseRepliesText(footerParts[3]) ?? {}
    const replyAnchor = Array.from(footer.querySelectorAll('a')).slice(-2).filter(a => !a.innerText.startsWith('@OP'))[0]
    const title = header.innerText
    const text = (header.nextElementSibling as HTMLElement).innerText
    const groupH3 = document.createElement('h3')
    const groupAnchor = document.createElement('a')
    groupH3.className = 'post-title'
    groupH3.className = 'thread-link'
    groupAnchor.href = companyBookmark.url
    groupAnchor.innerHTML = `<sub>${companyBookmark.name}</sub>`
    groupH3.appendChild(groupAnchor)
    if (isTop25) {
      const divider = document.createElement('span')
      divider.innerHTML = `&nbsp;|&nbsp;`
      groupH3.appendChild(divider)
      const companyAnchor = document.createElement('a')
      companyAnchor.href = companyHref
      companyAnchor.innerHTML = `<sub>${company}</sub>`
      groupH3.appendChild(companyAnchor)
    }
    header.appendChild(groupH3)
        
    return toPostCard({
      groupName: companyBookmark.name,
      company,
      companyHref,
      title,
      text,
      date: date.getTime(),
      replyCount,
      replyHref: replyAnchor ? replyAnchor.href : undefined,
      lastReply: lastReply ? lastReply.getTime() : undefined,
      renderable: postElement
    })
  })
}
const CompanyBookmarks = getCompanyBookmarks()
export const TheLayoffCompanyScraper: Userscript = {
  name: "TheLayoffCompanyScraper",

  isSupported: (href: string): boolean => CompanyBookmarks.some(({ url }) => href.startsWith(url)),

  render: async (href: string): Promise<void> => {
    const foundInfo = CompanyBookmarks.find(info => href.startsWith(info.url))
    if (foundInfo === undefined) return

    await awaitPageLoadByMutation();
    const timestamp = Date.now()
    const persistence = Persistence(foundInfo.name)
    const cards = scrapePosts(foundInfo)
    persistence.storeDashboard(timestamp, cards)
  },
}
