import React, { useState, CSSProperties } from "react";
import { createSpinningContentElement, SpinningContentParameters } from "./style_functions";
import "./styles.scss";

export interface LoadingPopupProps {
    isOpen: boolean;
    message?: string;
    spinnerSize?: 'small' | 'medium' | 'large';
}

export function LoadingPopup({
    isOpen,
    message = 'Loading...',
    spinnerSize = 'medium',
}: LoadingPopupProps) {

    if (!isOpen) return null
    return createSpinningContentElement({
        popupElementType: 'div',
        spinnerSize,
        content: {
            content: (
                <p style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    fontWeight: 'var(--font-medium)',
                    margin: 0,
                }}>{message}</p>
            ),
            containerElementType: 'div',
            contentContainerStyle: {
                backgroundColor: 'var(--bg-white)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-2xl)',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-lg)',
                minWidth: '250px',
                maxWidth: '400px',
            }
        }
    })
}
