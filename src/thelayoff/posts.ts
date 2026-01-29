import { Card } from '../dashboardcomponents/datatypes'

export interface PostDivMetadata {
    title: string
    href: string
    text: string
    lastReplyText: string
    replyCount: number
    replyHref?: string
    lastReply?: number
    companyBookmark: {
        name: string
        href: string
    }
    companyLink: {
        href: string
        name: string
    }
}

export interface Post extends Card {
    date: number
    company: string
    lastReply?: number
    replyCount: number
    postDiv: PostDivMetadata
}

export function sortPosts(l: Post, r: Post) {
    const order1 = (r.lastReply ?? r.date) - (l.lastReply ?? l.date)
    const order2 = l.company.localeCompare(r.company)

    return 0 !== order1 ? order1 :
        0 !== order2 ? order2 : l.postDiv.title.localeCompare(r.postDiv.title)
}
