import React, { useState, useEffect, useRef, CSSProperties, JSX } from 'react';
import '../common/ui/styles.scss';
import { Dialog } from 'primereact/dialog';
import {
    Card,
    toCardIndex,
    toCardElementId,
    fromCardElementId,
    CardLoadingAPI,
    ItemFilter,
    ItemSort,
} from './datatypes';
import { PersistenceClass } from './persistence';
import { Picklist } from './PickList';
import { FilterSort } from './FilterSort';
import { InfoDisplay } from './InfoDisplay';
import { OptionalFeatures } from './OptionalFeatures';
import { DashboardCardLayoutType, DashboardCardLayout } from './DashboardCardLayout';
import { Renderable } from './datatypes';
import { DashboardElementLayout } from './DashboardElementLayout';
import { awaitCondition } from '../common/await_functions';

export type DashboardContentLayoutProps = {
    type: 'Card'
    properties: {
        layout: DashboardCardLayoutType,
        toCardComponent: (card: Card) => HTMLElement
        cardStyle?: CSSProperties
    }
} | {
    type: 'Element'
    properties: {
        id: string
        renderable: Renderable<Card>
        registerRenderRenderable?: (renderRenderable: (renderable: Renderable<Card>) => Promise<void>) => void
    }
}

export interface AddedHeaderComponent {
    /* if item designated in 'after' doesn't exist it falls to next existing item in list. lastrow always exists */
    after: 'picklist' | 'infodisplay' | 'filtersort' | 'lastrow' | 'lastColumn',
    element: JSX.Element,
}

export interface DashboardProps {
    title: string
    getCards: () => Card[];
    cardLoadingAPI?: CardLoadingAPI<Card>
    onCardsLoaded?: (cards: Card[]) => void
    onDisplayedCards?: (cards: Card[]) => void
    onCardSelected?: (card: Card | null) => void
    style?: CSSProperties
    modal?: boolean
    contentLayout: DashboardContentLayoutProps
    registerVisibleFunction?: (setVisible: (show: boolean) => void) => void
    registerLoadFunction?: (reloadFunction: (showDialog: boolean, force: boolean) => Promise<void>) => void
    registerRerenderFunction?: (rerenderFunction: (focusOnCard?: Card) => void) => void
    onVisibleChange?: (visible: boolean) => void
    onClose?: () => void
    addedHeaderComponents?: AddedHeaderComponent[]
    closeable?: boolean
    features?: OptionalFeatures
}
interface DashboardState {
    visible: boolean
    selectedItem: Card | null
    isLoading: boolean
}
export const Dashboard: React.FC<DashboardProps> = ({
    title,
    getCards,
    cardLoadingAPI,
    onCardsLoaded,
    onDisplayedCards,
    onCardSelected,
    style,
    modal,
    contentLayout,
    registerVisibleFunction,
    registerLoadFunction,
    registerRerenderFunction,
    onVisibleChange,
    onClose,
    addedHeaderComponents,
    closeable = true,
    features
}) => {
    const persistence = useRef<PersistenceClass>(features ? features.getPersistence() : null)
    const renderDisplayCards = useRef<(orderedCards: Card[]) => Promise<void>>(null)
    const allCards = useRef<Card[]>(getCards())
    const [displayedCards, setDisplayedCards] = useState<Card[]>(features?.filterSort
        ? features.filterSort.sortAndFilterCards(allCards.current, persistence.current, features.filterSort.getFilterableItems()) : allCards.current)
    const [state, setState] = useState<DashboardState>({
        visible: true,
        selectedItem: null,
        isLoading: false,
    })
    const focusedElementIdRef = useRef<string>(null)
    const onFocusDisplayInfo = useRef<(data: Card | null) => void>(null)
    const itemDeselectedDelayMs = 5000
    const clearItemDeselectedTimeoutId = useRef<NodeJS.Timeout>(null)
    useEffect(() => {
        if (contentLayout.type === 'Card') {
            awaitCondition(
                () => ![null, undefined].includes(renderDisplayCards.current)
            ).then(() => renderDisplayCards.current(displayedCards))
        }
    }, [])
    useEffect(() => {
        if (onDisplayedCards) onDisplayedCards(displayedCards)
        if (renderDisplayCards.current) renderDisplayCards.current(displayedCards)
    }, [displayedCards]);

    const rerenderDashboard = (focusCard?: Card) => {
        setDisplayedCards([...displayedCards])
        if (focusCard) {
            onFocus(toCardIndex(focusCard.elementId, displayedCards))
        }
    }
    if (registerRerenderFunction) registerRerenderFunction(rerenderDashboard)
    if (registerVisibleFunction) registerVisibleFunction((show: boolean) => setState({ ...state, visible: show }))

    const refresh = async (showDialog: boolean, force: boolean): Promise<void> => {
        let newCards = cardLoadingAPI ? await cardLoadingAPI.loadCards(force) : getCards()
        allCards.current = newCards
        if (onCardsLoaded) onCardsLoaded(newCards)
        if (onVisibleChange) onVisibleChange(showDialog)
        if (features?.filterSort) {
            newCards = features.filterSort.sortAndFilterCards(newCards, persistence.current, features.filterSort.getFilterableItems())
        }
        setDisplayedCards(newCards)
        setState({
            ...state,
            visible: showDialog
        })
    }

    if (cardLoadingAPI) {
        cardLoadingAPI.registerOnIsLoadingChange((isLoading: boolean) => {
            setState({
                ...state,
                isLoading
            })
        })
    }
    if (registerLoadFunction) registerLoadFunction(refresh)

    const deselectItem = () => {
        if (clearItemDeselectedTimeoutId.current) {
            const timeoutId = clearItemDeselectedTimeoutId.current
            clearItemDeselectedTimeoutId.current = null
            clearTimeout(timeoutId)
        }
        clearItemDeselectedTimeoutId.current = setTimeout(() => {
            setState({ ...state, selectedItem: null })
            if (onCardSelected) onCardSelected(null)
            if (onFocusDisplayInfo.current) onFocusDisplayInfo.current(null)
        }, itemDeselectedDelayMs)
    }

    const selectItem = (itemIndex: number) => {
        if (clearItemDeselectedTimeoutId.current) {
            const timeoutId = clearItemDeselectedTimeoutId.current
            clearItemDeselectedTimeoutId.current = null
            clearTimeout(timeoutId)
        }
        let item: Card | null = null
        if (itemIndex < displayedCards.length) {
            item = displayedCards[itemIndex]
        }
        if (item) {
            if (onCardSelected) onCardSelected(item)
            if (onFocusDisplayInfo.current) onFocusDisplayInfo.current(item)
            setState({ ...state, selectedItem: item })
        } else {
            deselectItem()
        }

    }
    const onFocus = (index: number) => {
        focusedElementIdRef.current = toCardElementId(index)
        onMouseOver(index)
    }
    const onMouseOver = (index: number) => {
        selectItem(index)
    }

    const onMouseOut = (index: number) => {
        if (onCardSelected) {
            if (focusedElementIdRef.current) {
                onMouseOver(fromCardElementId(focusedElementIdRef.current))
                return
            }
        }
        deselectItem()
    }

    const getContent = (): JSX.Element => {
        switch (contentLayout.type) {
            case 'Element':
                return <DashboardElementLayout
                    id={contentLayout.properties.id}
                    renderable={contentLayout.properties.renderable}
                    registerRenderRenderable={contentLayout.properties.registerRenderRenderable}
                    onFocus={card => onFocus(toCardIndex(card.elementId, displayedCards))}
                    onMouseOver={card => onMouseOver(toCardIndex(card.elementId, displayedCards))}
                    onMouseOut={card => onMouseOut(toCardIndex(card.elementId, displayedCards))}
                />
            case 'Card':
                return <DashboardCardLayout
                    layout={contentLayout.properties.layout}
                    cardIndices={displayedCards.map((_item, index) => index)}
                    registerRenderCardsInShells={renderCardsInShells => { renderDisplayCards.current = renderCardsInShells }}
                    toCardComponent={contentLayout.properties.toCardComponent}
                    cardStyle={contentLayout.properties.cardStyle}
                    onFocus={onFocus}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                />
            default:
                return <>{`[ CONTENT LAYOUT "${contentLayout['type']}" IS NOT IMPLEMENTED]`}</>
        }
    }
    const splitAddedComponents = (afterValue: string, addedComponents: AddedHeaderComponent[]): {
        afterAddedComponents: AddedHeaderComponent[],
        remainingAddedComponents: AddedHeaderComponent[]
    } => {
        const afterAddedComponents = addedComponents
            .filter(({ after }) => after === afterValue)
        const remainingAddedComponents = addedComponents.filter(({ after }) => after !== afterValue)
        return {
            afterAddedComponents,
            remainingAddedComponents
        }
    }

    const getFeatures = (addedComponents: AddedHeaderComponent[]): {
        headerCells: JSX.Element[],
        remainingAddedComponents: AddedHeaderComponent[]
    } => {
        if (features === undefined) return { headerCells: [], remainingAddedComponents: addedComponents }
        let remainingAddedComponents = [...addedComponents]

        const onElementIdCall = (elementId: string, callable: (index: number) => void) => {
            const index = toCardIndex(elementId, displayedCards)
            if (index == null) return
            callable(index)
        }
        const headerCells: JSX.Element[] = []
        if (features?.picklist) {
            const splitComponents = splitAddedComponents('picklist', remainingAddedComponents)
            remainingAddedComponents = splitComponents.remainingAddedComponents
            headerCells.push(<td>
                <Picklist
                    persistence={persistence.current}
                    pageTypes={features.picklist.pageTypes}
                    usingPage={features.picklist.usingPage}
                    items={displayedCards}
                    onFocusInDashboard={async (elementId: string) => onElementIdCall(elementId, onFocus)}
                    onMouseOver={(elementId: string) => onElementIdCall(elementId, onMouseOver)}
                    onMouseOut={(elementId: string) => onElementIdCall(elementId, onMouseOut)}
                />
                {
                    splitComponents.afterAddedComponents
                        .map(addedHeaderComponent => (<div style={{ float: 'left' }}>{addedHeaderComponent.element}</div>))
                }
            </td>)
        }
        if (features?.infoDisplay) {
            const splitComponents = splitAddedComponents('infodisplay', remainingAddedComponents)
            remainingAddedComponents = splitComponents.remainingAddedComponents
            headerCells.push(<td style={{ width: '200px' }} rowSpan={features.infoDisplay.infoDisplayRowSpan ?? 1}>
                <InfoDisplay
                    registerDisplayTrigger={triggerInfoDisplay => { onFocusDisplayInfo.current = triggerInfoDisplay }}
                    textPaddingLeft={features.infoDisplay.textPaddingLeft}
                    titlePaddingLeft={features.infoDisplay.titlePaddingLeft}
                />
                {
                    splitComponents.afterAddedComponents
                        .map(addedHeaderComponent => (<div>{addedHeaderComponent.element}</div>))
                }
            </td>)
        }
        if (features?.filterSort) {
            const splitComponents = splitAddedComponents('filtersort', remainingAddedComponents)
            remainingAddedComponents = splitComponents.remainingAddedComponents
            headerCells.push(<td>
                <FilterSort
                    persistence={persistence.current}
                    getFilterableItems={features.filterSort.getFilterableItems}
                    sortingFields={features.filterSort.sortingFields}
                    initialCards={allCards.current}
                    onChange={(filter: ItemFilter[], sorting: ItemSort[]) => {
                        const newCards = features.filterSort.sortAndFilterCards(allCards.current, persistence.current, features.filterSort.getFilterableItems(), filter, sorting)
                        setDisplayedCards(newCards)
                    }}
                />
                {
                    splitComponents.afterAddedComponents
                        .map(addedHeaderComponent => (<div style={{ float: 'right' }}>{addedHeaderComponent.element}</div>))
                }
            </td>)
        }
        return { headerCells, remainingAddedComponents }
    }
    const render = () => {
        const featureResults = getFeatures(addedHeaderComponents)
        const headerCells = featureResults.headerCells
        let remainingAddedComponents = featureResults.remainingAddedComponents
        const lastRowSplitComponents = splitAddedComponents('lastrow', remainingAddedComponents)
        const lastColumnSplitComponents = splitAddedComponents('lastcolumn', lastRowSplitComponents.remainingAddedComponents)
        remainingAddedComponents = lastColumnSplitComponents.remainingAddedComponents
        const rowComponents = [...lastRowSplitComponents.afterAddedComponents, ...remainingAddedComponents]
        const colComponents = lastColumnSplitComponents.afterAddedComponents

        return (
            <Dialog
                appendTo={'self'}
                showHeader={true}
                closable={closeable}
                showCloseIcon={closeable}
                position={'center'}
                visible={state.visible}
                onHide={() => {
                    setState({ ...state, visible: false })
                    if (onClose) onClose()
                }}
                style={{ width: '90vw', height: '90vh', ...(style ?? {}) }}
                modal={undefined === modal ? true : modal} /*true is default value*/
                header={
                    <table
                        style={{
                            tableLayout: 'auto',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            marginTop: '0',
                            marginBottom: 'auto',
                            width: '100%',
                        }}
                    ><tbody>
                            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                                <td colSpan={1000} className="text-center">
                                    <h2>{title}</h2>
                                </td>
                            </tr>
                            {0 < headerCells.length && (
                                <tr style={{ alignItems: 'center', verticalAlign: 'top' }}>
                                    {headerCells}
                                </tr>
                            )}
                            {
                                rowComponents
                                    .map((addedHeaderComponent, row, rows) => {
                                        const isLastRow = rows.length <= (row + 1)
                                        const lastcolspan = isLastRow && 0 < colComponents.length
                                            ? Math.max(3 - colComponents.length, 1)
                                            : 3
                                        const othercolspan = isLastRow && 0 < colComponents.length
                                            ? 1 : 3
                                        return (
                                            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                                                <td colSpan={othercolspan}>
                                                    {addedHeaderComponent.element}
                                                </td>
                                                {isLastRow &&
                                                    0 < colComponents.length &&
                                                    colComponents.map((addedHeaderComponent, col, cols) => {
                                                        const isLastCol = cols.length <= col + 1
                                                        return (
                                                            <td colSpan={isLastCol ? lastcolspan : othercolspan}>
                                                                {addedHeaderComponent.element}
                                                            </td>
                                                        )
                                                    })
                                                }
                                            </tr>
                                        )
                                    })
                            }
                            {0 === rowComponents.length && 0 < colComponents.length && (
                                <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                                    {
                                        colComponents.map((addedHeaderComponent, col, cols) => {
                                            const isLastCol = cols.length <= col + 1
                                            return (
                                                <td colSpan={isLastCol ? Math.max(col + 1 - 3, 1) : 1}>
                                                    {addedHeaderComponent.element}
                                                </td>
                                            )
                                        })
                                    }
                                </tr>
                            )}
                        </tbody></table>
                }
                className='p-dialog-maximized'
            >
                {getContent()}
            </Dialog>
        );
    };
    return render();
};