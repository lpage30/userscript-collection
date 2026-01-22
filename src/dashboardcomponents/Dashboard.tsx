import React, { useState, useEffect, useRef, CSSProperties, JSX } from 'react';
import '../common/ui/styles.scss';
import { Dialog } from 'primereact/dialog';
import { awaitElementById } from '../common/await_functions';
import {
    Card,
    toCardIndex,
    toCardElementId,
    fromCardElementId,
    CardLoadingAPI,
    CardShellContainerId,
    ItemFilter,
    ItemSort,
} from './datatypes';
import CardShell from './CardShell';
import { PersistenceClass } from './persistence';
import { Picklist } from './PickList';
import { FilterSort } from './FilterSort';
import { InfoDisplay } from './InfoDisplay';
import { OptionalFeatures } from './OptionalFeatures';

export type DashboardLayout = 'vertical' | 'horizontal' | 'grid' | 'grid-2' | 'grid-3' | 'grid-4'
export interface AddedHeaderComponent {
    /* if item designated in 'after' doesn't exist it falls to next existing item in list. lastrow always exists */
    after: 'picklist' | 'infodisplay' | 'filtersort' | 'lastrow',
    element: JSX.Element,
}

export interface DashboardProps {
    title: string
    getCards: () => Card[];
    cardLoadingAPI?: CardLoadingAPI<Card>
    onCardsLoaded?: (cards: Card[]) => void
    onCardSelected?: (card: Card | null) => void
    toCardComponent: (card: Card) => HTMLElement
    style?: CSSProperties
    cardStyle?: CSSProperties
    layout?: DashboardLayout
    registerLoadFunction?: (reloadFunction: (showDialog: boolean, force: boolean) => Promise<void>) => void
    registerRerenderFunction?: (rerenderFunction: () => void) => void
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
    onCardSelected,
    toCardComponent,
    style,
    cardStyle,
    layout = 'grid',
    registerLoadFunction,
    registerRerenderFunction,
    onVisibleChange,
    onClose,
    addedHeaderComponents,
    closeable = true,
    features
}) => {
    const persistence = useRef<PersistenceClass>(features ? features.getPersistence() : null)
    const allCards = useRef<Card[]>(getCards())
    const [displayedCards, setDisplayedCards] = useState<Card[]>(features.filterSort
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
        refreshCards();
    }, [displayedCards]);

    const rerenderDashboard = () => {
        setDisplayedCards([...displayedCards])
    }
    if (registerRerenderFunction) registerRerenderFunction(rerenderDashboard)
    const refresh = async (showDialog: boolean, force: boolean): Promise<void> => {
        let newCards = cardLoadingAPI ? await cardLoadingAPI.load(force) : getCards()
        allCards.current = newCards
        if (onCardsLoaded) onCardsLoaded(newCards)
        if (onVisibleChange) onVisibleChange(showDialog)
        if (features.filterSort) {
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

    const refreshCards = async () => {
        await awaitElementById(toCardElementId(displayedCards.length - 1))
        displayedCards.forEach((_item, index) => {
            const cardParent = document.getElementById(toCardElementId(index));
            if (cardParent.firstChild) {
                cardParent.removeChild(cardParent.firstChild)
            }
        });
        displayedCards.forEach((item, index) => {
            const cardParent = document.getElementById(toCardElementId(index));
            cardParent.replaceChildren(toCardComponent(item) as Node)
        });
    }

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

    const getDivStyle = (index: number) => {
        const displayType = index < displayedCards.length ? 'block' : 'none';
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

    const layoutItems = (layout: DashboardLayout, itemIndices: number[]): JSX.Element => {
        return (
            <div
                id={CardShellContainerId}
                className={`${layout}-scroll-container`}
            >
                {itemIndices.map(index => (
                    <CardShell
                        id={toCardElementId(index)}
                        index={index}
                        onFocus={onFocus}
                        getStyle={getDivStyle}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        className={`${layout}-scroll-content`}
                    />
                ))}
            </div>
        )
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
        const splitAddedComponents = (afterValue: string) => {
            const result = remainingAddedComponents
                .filter(({ after }) => after === afterValue)
            remainingAddedComponents = remainingAddedComponents.filter(({ after }) => after !== afterValue)
            return result
        }
        const headerCells: JSX.Element[] = []
        if (features.picklist) {
            const picklistAddedComponents = splitAddedComponents('picklist')
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
                    picklistAddedComponents
                        .map(addedHeaderComponent => (<div style={{ float: 'left' }}>{addedHeaderComponent.element}</div>))
                }
            </td>)
        }
        if (features.infoDisplay) {
            const infodisplayAddedComponents = splitAddedComponents('infodisplay')
            headerCells.push(<td style={{ width: '200px' }} rowSpan={features.infoDisplay.infoDisplayRowSpan ?? 1}>
                <InfoDisplay
                    registerDisplayTrigger={triggerInfoDisplay => { onFocusDisplayInfo.current = triggerInfoDisplay }}
                    textPaddingLeft={features.infoDisplay.textPaddingLeft}
                    titlePaddingLeft={features.infoDisplay.titlePaddingLeft}
                />
                {
                    infodisplayAddedComponents
                        .map(addedHeaderComponent => (<div>{addedHeaderComponent.element}</div>))
                }
            </td>)
        }
        if (features.filterSort) {
            const filtersortAddedComponents = splitAddedComponents('filtersort')
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
                    filtersortAddedComponents
                        .map(addedHeaderComponent => (<div style={{ float: 'right' }}>{addedHeaderComponent.element}</div>))
                }
            </td>)
        }
        return { headerCells, remainingAddedComponents }
    }
    const render = () => {
        const { headerCells, remainingAddedComponents } = getFeatures(addedHeaderComponents)
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
                                remainingAddedComponents
                                    .map((addedHeaderComponent) => (
                                        <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                                            <td colSpan={3}>
                                                {addedHeaderComponent.element}
                                            </td>
                                        </tr>
                                    ))
                            }
                        </tbody></table>
                }
                className='p-dialog-maximized'
            >
                {layoutItems(layout, displayedCards.map((_item, index) => index))}
            </Dialog>
        );
    };
    return render();
};