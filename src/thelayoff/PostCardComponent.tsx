import React, { JSX } from 'react'
import { Post } from './posts'
import { reactToHTMLElement } from '../common/ui/renderRenderable'
import { Card } from '../dashboardcomponents/datatypes'
import { formatDuration, TIME_TYPE, TIME_FORMAT_TYPE } from '../common/datetime'

interface PostCardComponentProps {
    id: string
    post: Post
}
export const PostCardComponent: React.FC<PostCardComponentProps> = ({
    id,
    post
}) => {
    const getFooterContentElements = (): JSX.Element => {
        const text = `Posted ${formatDuration(Date.now() - post.date, { timeType: TIME_TYPE.MILLISECOND, timeFormat: TIME_FORMAT_TYPE.LARGESTSINGLE })} | ${post.postDiv.lastReplyText}`
        if (post.postDiv.replyHref) {
            return <a href={post.postDiv.replyHref}>{text}</a>
        }
        return <span>{text}</span>
    }
    return (
        <article id={id} style={{
            display: 'block',
            position: 'relative',
            width: '100%',
            border: '1px solid black',
        }}>
            <header style={{
                display: 'block',
                fontSize: '.788rem',
                lineHeight: 1.75,
                padding: '0 10px',
                fontFamily: 'Lora, serif',
                fontSizeAdjust: 0.5
            }}>
                <h2 style={{
                    display: 'block',
                    marginBlockStart: '0.83em',
                    marginBlockEnd: '0.83em',
                    marginInlineStart: '0px',
                    marginInlineEnd: '0px',
                    fontWeight: 500,
                    wordWrap: 'break-word',
                    fontSize: '1.57rem',
                }}>
                    <a href={post.postDiv.href}>{post.postDiv.title}</a>
                </h2>
                <h3 style={{
                    display: 'block',
                    marginBlockStart: '0.83em',
                    marginBlockEnd: '0.83em',
                    marginInlineStart: '0px',
                    marginInlineEnd: '0px',
                    fontWeight: 500,
                    wordWrap: 'break-word',
                    fontSize: '1.57rem',
                }}>
                    <a href={post.postDiv.companyBookmark.href}><sub>{post.postDiv.companyBookmark.name}</sub></a>
                    <span>&nbsp;|&nbsp;</span><a href={post.postDiv.companyLink.href}><sub>{post.postDiv.companyLink.name}</sub></a>
                </h3>
            </header>
            <div style={{
                display: 'block',
                fontFamily: 'Lora, serif',
                fontSize: '1.05rem',
                fontSizeAdjust: 0.5,
                lineHeight: 1.5,
                padding: '0 10px',
                wordWrap: 'break-word',
            }}>
                <p>{post.postDiv.text}</p>
            </div>
            <footer style={{
                display: 'inline-block',
                fontSize: '.788rem',
                lineHeight: 1.75,
                padding: '0 10px',
                borderRadius: '0 0 8px',
                backgroundColor: '#f5f5f5',
                borderTop: '1px solid #ddd',
                fontFamily: '"Open Sans", sans-serif',
                fontSizeAdjust: 0.535,
                marginTop: '10px',
                width: '100%',
                wordWrap: 'break-word',
            }}>
                <div>
                    <div style={{ display: 'inline-block' }}>
                        {getFooterContentElements()}
                    </div>
                </div>
            </footer>
        </article>
    )
}

export function toPostCardComponent(card: Card): HTMLElement {
    return reactToHTMLElement(
        card.elementId,
        <PostCardComponent id={card.elementId} post={card as Post} />
    )
}
