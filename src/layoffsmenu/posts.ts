import { toTitleCase } from '../common/functions'
import { parseDateTime, toMonthDayYearDateTime } from '../common/datetime'
import { Card, FilterableItems } from '../dashboardcomponents/datatypes'

export const PageTypes = ['company', 'last25', 'reply']
export const theLayoffBaseUrl = 'https://www.thelayoff.com/'
export function getPageType(href: string): string | null {
  if (href.startsWith(`${theLayoffBaseUrl}last-25.php`)) return 'last25'
  if (href.startsWith(`${theLayoffBaseUrl}t/`)) return 'reply'
  return 'company'
}

export interface Post extends Card{
    company: string
    companyHref: string
    title: string
    text: string
    date: number
    replyCount?: number
    replyHref?: string
    lastReply?: number
}

function parseRepliesText(replyText: string): { replyCount: number, lastReply: Date} | undefined {
    const regex = new RegExp(/^(\d+)[^\(]*\(([^\)]*)\).*$/g)
    const result = regex.exec(replyText.split('\n')[0])
    if (null === result) return undefined
    return {
        replyCount: parseInt(result[1]),
        lastReply: parseDateTime(result[2])
    }
}
function toPostCard(data: Partial<Post>): Post {
    const post: Partial<Post> = {}
    post.company = data.company ?? ''
    post.companyHref = data.companyHref ?? ''
    post.title = data.title ?? ''
    post.text = data.text ?? ''
    post.date = data.date ?? 0
    post.replyCount = data.replyCount
    post.replyHref = data.replyHref
    post.lastReply = data.lastReply
    post.renderable = data.renderable ?? null
    post.displayLines = () => [
        post.company,
        `Date: ${toMonthDayYearDateTime(post.date)}`,
        `LastReply: ${post.lastReply ? toMonthDayYearDateTime(post.lastReply) : 'none'}`
    ]
    post.label = () => `${post.company}|${post.title}`
    post.color = () => 'blue'
    post.href = (pageName: string) => pageName === 'last25' 
        ? 'https://www.thelayoff.com/last-25.php'
        : pageName === 'reply' 
            ? post.replyHref ?? post.companyHref
            : post.companyHref
    post.elementId = (pageName: string) => post.renderable?.id
    return post as Post
}

function scrapePost(postElement: HTMLElement, pageType: string): Post {
    const firstChild = postElement.firstElementChild as HTMLElement
    if (firstChild.tagName !== 'HEADER') {
        firstChild.style.display = 'none'
    }
    const header = postElement.querySelector('header')
    const footer = postElement.querySelector('footer')
    const footerParts = footer.innerText.split('|').map(t => t.trim())
    const onLast25Page = pageType === 'last25'
    const companyHref = onLast25Page
        ? Array.from(footer.querySelectorAll('a')).slice(-1)[0].href
        : window.location.href
    const company = toTitleCase((new URL(companyHref)).pathname.replace(/\//g, '').replace(/-/g, ' ')) 

    const date = parseDateTime(footerParts[0])
    const {replyCount, lastReply } = parseRepliesText(footerParts[3]) ?? {}
    const replyAnchor = Array.from(footer.querySelectorAll('a')).slice(onLast25Page ? -3 : -2).filter(a => !a.innerText.startsWith('@OP'))[0]
    const title = header.innerText
    const text = (header.nextElementSibling as HTMLElement).innerText
    if (onLast25Page) {
        const companyH2 = document.createElement('h2')
        const companyAnchor = document.createElement('a')
        companyH2.className = 'post-title'
        companyAnchor.className = 'thread-link'
        companyAnchor.href = companyHref
        companyAnchor.innerText = company
        companyH2.appendChild(companyAnchor)
        header.insertBefore(companyH2, header.firstElementChild)
    }
    return toPostCard({
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
}

export function scrapePosts(pageType: string): Post[] {
    return Array.from(document.getElementById('posts').querySelectorAll('article')).map(element => scrapePost(element, pageType))
}

export const sortingFields = ['company', 'date', 'lastReply', 'replyCount' ];
export const filterableItems: FilterableItems = {}
