import React from "react";
import { CompanyBookmark, getCompanyBookmarks } from "./bookmarkedCompanies";
import "../common/ui/styles.scss";
import { Userscript } from "../common/userscript";
import { Persistence } from "../dashboardcomponents/persistence";
import {
  awaitPageLoadByMutation,
} from "../common/await_functions";
import { Post, PostDivMetadata } from "./posts";
import { toPostCard } from "./posts_functions";
import { toTitleCase } from "../common/functions";
import { parseDate, parseDateTime } from "../common/datetime";


function toReplyData(postFooterElement: HTMLElement): {
  lastReplyText: string
  replyCount: number
  lastReply?: number
  replyHref?: string
} {
  const regex = new RegExp(/^(\d+)[^\(]*\(([^\)]*)\).*$/g)
  const footerParts = postFooterElement.innerText.split('|').map(t => t.trim())
  const replyElement = postFooterElement.querySelector('span[class*="nreplies"]')
  const lastReply = 0 < replyElement.childElementCount ? parseDate((replyElement.lastElementChild as HTMLElement).title) : undefined
  const replyCount = parseInt((regex.exec(footerParts[3]) ?? [])[1])
  const replyAnchor = Array.from(postFooterElement.querySelectorAll('a')).slice(-2).filter(a => !a.innerText.startsWith('@OP'))[0]

  return {
    lastReplyText: (replyElement as HTMLElement).innerText,
    replyCount: isNaN(replyCount) ? 0 : replyCount,
    lastReply: lastReply ? lastReply.getTime() : undefined,
    replyHref: replyAnchor ? replyAnchor.href : undefined
  }
}

function toPostDivMetadata(postElement: HTMLElement, companyBookmark: CompanyBookmark): PostDivMetadata {
  const header = postElement.querySelector('header')
  const footer = postElement.querySelector('footer')
  const {
    lastReplyText,
    replyCount,
    replyHref,
    lastReply
  } = toReplyData(footer)
  const companyHref = companyBookmark.name === 'Top25'
    ? Array.from(footer.querySelectorAll('a')).slice(-1)[0].href
    : window.location.href
  const companyName = toTitleCase((new URL(companyHref)).pathname.replace(/\//g, '').replace(/-/g, ' '))

  return {
    title: header.innerText,
    href: header.querySelector('a').href,
    text: (header.nextElementSibling as HTMLElement).innerText,
    lastReplyText,
    replyCount,
    replyHref,
    lastReply,
    companyBookmark: {
      name: companyBookmark.name,
      href: companyBookmark.url,
    },
    companyLink: {
      href: companyHref,
      name: companyName
    }
  }
}

function scrapePosts(companyBookmark: CompanyBookmark): Post[] {
  return Array.from(document.getElementById('posts').querySelectorAll('article')).map(postElement => {
    const postDiv = toPostDivMetadata(postElement, companyBookmark)
    const footer = postElement.querySelector('footer')
    const date = parseDate(footer.querySelector('time').dateTime) ?? new Date()

    return toPostCard({
      groupName: companyBookmark.name,
      date: date.getTime(),
      postDiv
    })
  })
}

const CompanyBookmarks = getCompanyBookmarks()

export const TheLayoffCompanyScraper: Userscript = {
  name: "TheLayoffCompanyScraper",
  containerId: 'the-layoff-company-scraper',
  isSupported: (href: string): boolean => CompanyBookmarks.some(({ url }) => href.startsWith(url)),
  preparePage: async (href: string): Promise<void> => {
    const foundInfo = CompanyBookmarks.find(info => href.startsWith(info.url))
    if (foundInfo === undefined) return
    await awaitPageLoadByMutation();
  },
  cleanupContainers: async (href: string): Promise<boolean> => false,
  createContainer: async (href: string): Promise<HTMLElement> => null,
  renderInContainer: async (href: string, container: HTMLElement): Promise<void> => {
    const foundInfo = CompanyBookmarks.find(info => href.startsWith(info.url))
    if (foundInfo === undefined) return

    const timestamp = Date.now()
    const persistence = Persistence(foundInfo.name)
    const cards = scrapePosts(foundInfo)
    persistence.storeDashboard(timestamp, cards)

  },
}
