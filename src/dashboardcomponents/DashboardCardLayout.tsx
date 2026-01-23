import React, { useState, useRef, CSSProperties } from 'react';
import { Card, CardShellContainerId, toCardElementId } from './datatypes';
import CardShell from './CardShell';
import { awaitElementById } from '../common/await_functions';

export type DashboardCardLayoutType = 'vertical' | 'horizontal' | 'grid' | 'grid-2' | 'grid-3' | 'grid-4'

export interface DashboardCardLayoutProps {
    layout: DashboardCardLayoutType,
    cardIndices: number[]
    registerRenderCardsInShells: (renderInShells: (orderedCards: Card[]) => Promise<void>) => void
    toCardComponent: (card: Card) => HTMLElement
    cardStyle?: CSSProperties
    onFocus?: (cardIndex: number) => void
    onMouseOver?: (cardIndex: number) => void
    onMouseOut?: (cardIndex: number) => void
}

export const DashboardCardLayout: React.FC<DashboardCardLayoutProps> = ({
    layout,
    cardIndices,
    registerRenderCardsInShells,
    toCardComponent,
    cardStyle,
    onFocus,
    onMouseOver,
    onMouseOut,
}) => {
    const [cards, setCards] = useState<Card[]>([])
    const CardShellContainerRef = useRef(null)
    const focusedElementIdRef = useRef<string>(null)

    const getDivStyle = (index: number): CSSProperties => {
        const displayType = index < cards.length ? 'block' : 'none';
        const result =
            focusedElementIdRef.current === toCardElementId(index)
                ? {
                    ...(cardStyle ?? {}),
                    backgroundColor: 'yellow',
                    transition: 'background-color 0.5s ease-in-out',
                    display: displayType,
                }
                : {
                    ...(cardStyle ?? {}),
                    display: displayType,

                };
        return result;
    };

    const renderCardsInShells = async (orderedCards: Card[]) => {
        await awaitElementById(toCardElementId(orderedCards.length - 1))
        orderedCards.forEach((_item, index) => {
            const cardParent = CardShellContainerRef.current.querySelector(`div[id="${toCardElementId(index)}"]`)
            if (cardParent.firstChild) {
                cardParent.removeChild(cardParent.firstChild)
            }
        });
        orderedCards.forEach((item, index) => {
            const cardParent = CardShellContainerRef.current.querySelector(`div[id="${toCardElementId(index)}"]`)
            cardParent.replaceChildren(toCardComponent(item) as Node)
        });
        setCards(orderedCards)
    }
    registerRenderCardsInShells(renderCardsInShells)
    return (
        <div
            id={CardShellContainerId}
            className={`${layout}-scroll-container`}
            ref={CardShellContainerRef}
        >
            {cardIndices.map(index => (
                <CardShell
                    id={toCardElementId(index)}
                    index={index}
                    onFocus={(index: number) => {
                        focusedElementIdRef.current = toCardElementId(index)
                        onFocus(index)
                    }}
                    getStyle={getDivStyle}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    className={`${layout}-scroll-content`}
                />
            ))}
        </div>
    )
}