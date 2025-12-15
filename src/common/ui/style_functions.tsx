import React, { CSSProperties, JSX } from "react";
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
}

export function createSpinningContentElement(params?: SpinningContentParameters): JSX.Element {
    const {
        popupElementType = 'NoPopup',
        spinnerSize = 'medium',
        spinnerDelay = '1s',
        backgroundColor = 'rgba(0, 0, 0, 0.5)'
    } = params ?? {}
    const {
        content = null,
        containerElementType = 'NoContainer',
        contentContainerStyle = null
    } = (params ?? {}).content ?? {}

    const spinnerSizeMap = {
        small: 30,
        medium: 50,
        large: 80,
    }

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
    const childSpinnerStyle: CSSProperties = {
        width: `${spinnerSizeMap[spinnerSize]}px`,
        height: `${spinnerSizeMap[spinnerSize]}px`,
        border: `4px solid var(--border-light)`,
        borderTop: `4px solid var(--primary-color)`,
        borderRadius: '50%',
        animation: `spin ${spinnerDelay} linear infinite`,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 8888,
    }
    const childSpinnerStyleElement: JSX.Element = (
        <style>
            {
                `@keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }`
            }
        </style>

    )
    let spinningElement: JSX.Element = (
        <>
            <div style={childSpinnerStyle} />
            {content}
        </>
    )
    switch (containerElementType) {
        case 'div':
            spinningElement = (
                <div style={contentContainerStyle}>
                    {spinningElement}
                </div>
            )
            break
        default:
            break
    }
    spinningElement = (
        <>
            {childSpinnerStyleElement}
            {spinningElement}
        </>
    )

    switch (popupElementType) {
        case 'div':
            spinningElement = (
                <div
                    style={popupParentElementStyle}
                >
                    {spinningElement}
                </div>
            )
            break
        default:
            break
    }
    return spinningElement
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
        .reduce((maxZIndex, {computedStyle}) => {
            const zIndex = parseInt(computedStyle.getPropertyValue('z-index'))
            return zIndex > maxZIndex ? zIndex : maxZIndex
        }, 0)

}