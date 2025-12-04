import React, { useState, CSSProperties } from "react";
import "./styles.css";

export interface LoadingPopupProps {
    isOpen: boolean;
    message?: string;
    spinnerSize?: "small" | "medium" | "large";
    onBackdropClick?: () => void;
    backdrop?: boolean;
}

export function LoadingPopup({
    isOpen,
    message = "Loading...",
    spinnerSize = "medium",
    onBackdropClick,
    backdrop = true,
}: LoadingPopupProps) {
    const [display, setDisplay] = useState<boolean>(isOpen)

    const spinnerSizeMap = {
        small: 30,
        medium: 50,
        large: 80,
    };

    const backdropStyle: CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    };

    const popupContainerStyle: CSSProperties = {
        backgroundColor: "var(--bg-white)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-2xl)",
        boxShadow: "var(--shadow-xl)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--spacing-lg)",
        minWidth: "250px",
        maxWidth: "400px",
    };

    const spinnerStyle: CSSProperties = {
        width: `${spinnerSizeMap[spinnerSize]}px`,
        height: `${spinnerSizeMap[spinnerSize]}px`,
        border: `4px solid var(--border-light)`,
        borderTop: `4px solid var(--primary-color)`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    };

    const messageStyle: CSSProperties = {
        fontSize: "var(--text-base)",
        color: "var(--text-primary)",
        textAlign: "center",
        fontWeight: "var(--font-medium)",
        margin: 0,
    };
    const render = () => {
        if (!display) {
            return null
        }
        return (
            <div
                style={backdrop ? backdropStyle : undefined}
                onClick={backdrop ? onBackdropClick : undefined}
            >
                <style>{`
            @keyframes spin {
            to {
                transform: rotate(360deg);
            }
            }
        `}</style>
                <div
                    style={popupContainerStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={spinnerStyle} />
                    <p style={messageStyle}>{message}</p>
                </div>
            </div>
        );
    }
    return render()
}
