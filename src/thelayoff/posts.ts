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
