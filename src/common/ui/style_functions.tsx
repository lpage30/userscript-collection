import React, { CSSProperties, JSX } from "react";
import './styles.css'

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
    switch(returnElementTagName) {
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
    switch(containerElementType) {
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

    switch(popupElementType) {
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