import { toMonthDayYearDateTime } from '../common/datetime'
import { Card, FilterableItems, ItemFilter } from '../dashboardcomponents/datatypes'
import { FavoriteCompanyList } from './FavoriteCompanyLayoffs'

export const theLayoffBaseUrl = 'https://www.thelayoff.com/'

export interface Post extends Card {
    company: string
    companyHref: string
    title: string
    text: string
    date: number
    replyCount?: number
    replyHref?: string
    lastReply?: number
}

export function toPostCard(data: Partial<Post>): Post {
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
        : post.companyHref
    post.elementId = post.renderable?.id
    return post as Post
}

export const sortingFields = ['groupName', 'company', 'date', 'lastReply', 'replyCount'];
export const filterableItems: FilterableItems = {
    groupName: {
        field: 'groupName',
        filter: FavoriteCompanyList
            .reduce((result, { name }) => ({
                ...result,
                [name]: true
            }), {} as { [value: string]: boolean })
    } as ItemFilter
}

