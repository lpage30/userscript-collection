import React, { useState, CSSProperties, ReactNode } from "react";
import { createSpinningContentElement, SpinningContentParameters } from "./style_functions";
import "./styles.scss";

export interface LoadingPopupProps {
    isOpen: boolean;
    message?: string;
    spinnerSize?: 'small' | 'medium' | 'large';
    registerSetProgress?: (setProgress: (progressMessage: string) => void) => void;
}

export function LoadingPopup({
    isOpen,
    message = 'Loading...',
    spinnerSize = 'medium',
    registerSetProgress
}: LoadingPopupProps) {
    const [progress, setProgress] = useState('')
    if (registerSetProgress) registerSetProgress((progressMessage: string) => setProgress(progressMessage))
    if (!isOpen) return null
    return createSpinningContentElement({
        popupElementType: 'div',
        spinnerSize,
        content: {
            content: (
                <>
                    <p style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        fontWeight: 'var(--font-medium)',
                        margin: 0,
                    }}>{message}</p>
                    {0 < progress.length && <p style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        fontWeight: 'var(--font-medium)',
                        margin: 0,
                    }}>{progress}</p>
                    }
                </>
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
