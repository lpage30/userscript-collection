import { toMonthDayYearDateTime } from '../common/datetime'
import { FilterableItems, ItemFilter } from '../dashboardcomponents/datatypes'
import { Post } from './posts'
import { toHashCode } from '../common/functions'

export const theLayoffBaseUrl = 'https://www.thelayoff.com/'

export function toPostCard(data: Partial<Post>): Post {
    const post: Partial<Post> = { ...data }
    post.company = post.postDiv.companyLink.name
    post.lastReply = post.postDiv.lastReply
    post.replyCount = post.postDiv.replyCount
    post.displayLines = () => [
        post.postDiv.companyLink.name,
        `Date: ${toMonthDayYearDateTime(post.date)}`,
        `LastReply: ${post.postDiv.lastReply ? toMonthDayYearDateTime(post.postDiv.lastReply) : 'none'}`
    ]
    post.label = () => `${post.postDiv.companyLink.name}|${post.postDiv.title}`
    post.color = () => 'blue'
    post.href = (pageName: string) => pageName === 'last25'
        ? 'https://www.thelayoff.com/last-25.php'
        : post.postDiv.companyLink.href
    post.elementId = toHashCode(post.label())
    return post as Post
}

export const sortingFields = ['groupName', 'company', 'date', 'lastReply', 'replyCount'];
export const getFilterableItems = (getCompanyNames: () => string[]): FilterableItems => ({
    company: {
        field: 'company',
        type: 'ValueExistence',
        filter: getCompanyNames()
            .reduce((result, name) => ({
                ...result,
                [name]: true
            }), {} as { [value: string]: boolean })
    } as ItemFilter,
})
