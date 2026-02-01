import React, { CSSProperties, JSX, useState } from "react";
import './styles.scss'

export interface BlinkingContentParameters {
    returnElementTagName?: 'div' | 'span' | 'p',
    fontSize?: number
    fontFamily?: string
    color?: string
    blinkDelay?: string
    content?: any
}

export function createBlinkingContentElement(params?: BlinkingContentParameters): JSX.Element {
    const {
        returnElementTagName = 'span',
        fontSize = 18,
        fontFamily = 'Arial, sans-serif',
        color = '#d00',
        blinkDelay = '1s',
        content = null
    } = params ?? {}

    const parentElementStyle: CSSProperties = {
        fontSize,
        fontFamily,
        color,
        animation: `blink ${blinkDelay} steps(2, start) infinite`,
        WebkitAnimation: `blink ${blinkDelay} steps(2, start) infinite`,
    }
    const childStyleElement: JSX.Element = (
        <style>
            {
                `@keyframes blink {
                    to { visibility: hidden; }
                }`
            }
        </style>
    )
    switch (returnElementTagName) {
        case 'p':
            return <p style={parentElementStyle}>
                {content}
                {childStyleElement}
            </p>
        case 'span':
            return <span style={parentElementStyle}>
                {content}
                {childStyleElement}
            </span>
        default:
            return <div style={parentElementStyle}>
                {content}
                {childStyleElement}
            </div>
    }
}
export interface SpinningCircleParameters {
    spinnerSize?: 'small' | 'medium' | 'large'
    spinnerDelay?: string
    onCancel?: () => void // only when popupElementType === 'div'
}
export function SpinningCircle(params: SpinningCircleParameters) {
    const [hover, setHover] = useState(false)
    const {
        spinnerSize = params.onCancel ? 'large' : 'medium',
        spinnerDelay = '1s',
        onCancel
    } = params ?? {}

    const spinnerSizeMap = {
        small: 30,
        medium: 50,
        large: 80,
    }
    const buttonWidth = spinnerSizeMap[spinnerSize]
    const buttonHeight = Math.floor(spinnerSizeMap[spinnerSize] / 2)
    const containerWidth = onCancel ? Math.max(spinnerSizeMap[spinnerSize], buttonWidth) : spinnerSizeMap[spinnerSize]
    const containerHeight = spinnerSizeMap[spinnerSize] + (onCancel ? buttonHeight : 0)
    const spinnerTop = 0
    const spinnerLeft = Math.floor((containerWidth - spinnerSizeMap[spinnerSize]) / 2)
    const buttonTop = spinnerTop + spinnerSizeMap[spinnerSize]
    const buttonLeft = Math.floor((containerWidth - buttonWidth) / 2)
    const containerStyle: CSSProperties = {
        position: 'relative',
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        padding: 0,
        margin: 0,
    }
    const spinningCircleStyle: CSSProperties = {
        top: `${spinnerTop}px`,
        left: `${spinnerLeft}px`,
        width: `${spinnerSizeMap[spinnerSize]}px`,
        height: `${spinnerSizeMap[spinnerSize]}px`,
        border: `4px solid var(--border-light)`,
        borderTop: `4px solid var(--primary-color)`,
        borderRadius: '50%',
        animation: `spin ${spinnerDelay} linear infinite`,
    }
    const buttonStyle: CSSProperties = {
        top: `${buttonTop}`,
        left: `${buttonLeft}px`,
        width: `${buttonWidth}px`,
        height: `${buttonHeight}px`,
        padding: 0,
        margin: 0,
        color: 'white',
        fontSize: '10px',
        fontFamily: 'verdana',
        overflow: 'visible',
        whiteSpace: 'nowrap',
        backgroundColor: '#ff4d4d',
        border: `4px outset #ff4d4d`,
    }
    const hoverButtonStyle: CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#e60000',
        border: `4px inset #e60000`
    }
    const render = () => {
        const spinnerStyleElement = (
            <style>
                {
                    `
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                    `
                }
            </style>
        )
        if (onCancel) {
            return (
                <button
                    style={containerStyle}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    title={'click to cancel'}
                    onClick={onCancel}
                >
                    {spinnerStyleElement}
                    <div style={spinningCircleStyle} />
                    <div style={hover ? hoverButtonStyle : buttonStyle}>cancel</div>
                </button>
            )
        }
        return (
            <div style={containerStyle}>
                {spinnerStyleElement}
                <div style={spinningCircleStyle} />
            </div>
        )
    }
    return render()

}
export function CloseContainerButton(params: { onClose: () => void }) {
    const [hover, setHover] = useState(false)
    const closeButtonStyle: CSSProperties = {
        /* Positions the button relative to the container */
        position: 'absolute',
        /* Places it in the top right corner */
        top: '10px',
        right: '10px',
        backgroundColor: '#ff4d4d',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
    const hoverCloseButtonStyle: CSSProperties = {
        ...closeButtonStyle,
        backgroundColor: '#e60000'
    }
    return <button
        style={hover ? hoverCloseButtonStyle : closeButtonStyle}
        onClick={params.onClose}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
    >X</button>
}

interface SpinningContentType {
    content: any
    containerElementType?: 'NoContainer' | 'div'
    contentContainerStyle?: CSSProperties
}
export interface SpinningContentParameters {
    popupElementType?: 'NoPopup' | 'div'
    spinnerSize?: 'small' | 'medium' | 'large'
    spinnerDelay?: string
    backgroundColor?: string
    content?: SpinningContentType
    onCancel?: () => void // only when popupElementType === 'div'
}

export function createSpinningContentElement(params?: SpinningContentParameters): JSX.Element {
    const {
        popupElementType = 'NoPopup',
        backgroundColor = 'rgba(0, 0, 0, 0.5)'
    } = params ?? {}
    const {
        content = null,
        contentContainerStyle = null
    } = (params ?? {}).content ?? {}

    const popupParentElementStyle: CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    }

    switch (popupElementType) {
        case 'div':
            return (
                <div style={popupParentElementStyle}>
                    <div style={contentContainerStyle}>
                        <SpinningCircle spinnerSize={params.spinnerSize} spinnerDelay={params.spinnerDelay} onCancel={params.onCancel} />
                        {content}
                    </div>
                </div>
            )
        default:
            return (
                <>
                    <SpinningCircle spinnerSize={params.spinnerSize} spinnerDelay={params.spinnerDelay} onCancel={params.onCancel} />
                    {content}
                </>
            )
    }
}
export interface ElementInfo {
    element: Element
    computedStyle: CSSStyleDeclaration
}
export function isDisplayedElement(elementInfo: ElementInfo | null): boolean {
    if (elementInfo === null) return false
    // Check for common visibility issues:
    // 1. display is not 'none'
    // 2. visibility is not 'hidden' or 'collapse'
    // 3. opacity is not '0'
    // 4. (Optional) check clientHeight/clientWidth for zero size elements

    return elementInfo.computedStyle.getPropertyValue('display') !== 'none' &&
        elementInfo.computedStyle.getPropertyValue('visibility') !== 'hidden' &&
        elementInfo.computedStyle.getPropertyValue('visibility') !== 'collapse' &&
        elementInfo.computedStyle.getPropertyValue('opacity') !== '0' &&
        elementInfo.element.clientHeight > 0 &&
        elementInfo.element.clientWidth > 0;
}


export function getElementInfo(element: Element): ElementInfo | null {
    if (!element.isConnected || element.nodeType !== Node.ELEMENT_NODE) {
        return null
    }
    return {
        element,
        computedStyle: window.getComputedStyle(element)
    }
}

export function getMaximumZIndex(): number {
    return Array.from(document.querySelectorAll('*'))
        .map(value => getElementInfo(value))
        .filter(element => isDisplayedElement(element) && ![undefined, 'auto'].includes(element.computedStyle.getPropertyValue('z-index')))
        .reduce((maxZIndex, { computedStyle }) => {
            const zIndex = parseInt(computedStyle.getPropertyValue('z-index'))
            return zIndex > maxZIndex ? zIndex : maxZIndex
        }, 0)
}
export function padToAlign(maxLength: number, curLength: number): JSX.Element {
    const rem = (maxLength - curLength) / 2
    return maxLength === curLength ? null : (<span style={{ display: 'inline-block', width: `${rem}rem` }}></span>)
}
export function getHeightWidth(element: HTMLElement): { height: number, width: number } {
    const { width, height } = element.getBoundingClientRect()
    return { width, height }
}
export function scaleDimension(srcDim: { height: number, width: number }, fixedSideLength: number, isWidth: boolean): { height: number, width: number } {
    if (isWidth) {
        return { height: Math.round(fixedSideLength * (srcDim.height / srcDim.width)), width: fixedSideLength }
    }
    return { height: fixedSideLength, width: Math.round(fixedSideLength * (srcDim.width / srcDim.height)) }
}

export function applyStylesToElement<T extends HTMLElement>(element: T, styles?: CSSProperties) {
    if ([null, undefined].some(n => n === element || n === styles)) {
        return
    }
    for (const key in styles) {
        if (Object.prototype.hasOwnProperty.call(styles, key)) {
            // The DOM style property expects camelCase, which React uses natively
            element.style[key] = styles[key];
        }
    }
}
