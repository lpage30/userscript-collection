import React, { useState, ReactNode, CSSProperties, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import { awaitElementById } from '../await_functions'
import { getHeightWidth } from './style_functions'

interface ControlPanelProps {
    id: string
    title?: string
    visible?: boolean
    canHide?: boolean
    maximizable?: boolean
    content: ReactNode
    style?: CSSProperties
    position?: 'top-left' | 'top' | 'top-right' | 'right' | 'center' | 'left' | 'bottom-left' | 'bottom' | 'bottom-right'

}
export const ControlPanel: React.FC<ControlPanelProps> = ({
    id,
    title,
    visible = false,
    canHide = true,
    maximizable,
    position = 'top-right',
    style,
    content
}) => {
    const [display, setDisplay] = useState<boolean>(!canHide ? true : visible)
    const [dimensions, setDimensions] = useState<{ width: string, height: string }>({ width: 'auto', height: 'auto' })
    useEffect(() => {
        setPanelDimensions()
    }, [display])
    const setPanelDimensions = async () => {
        const panelElement = await awaitElementById(id)
        const { width, height } = getHeightWidth(panelElement);
        setDimensions({ width: `${width}px`, height: `${height}px` });
    }
    return <Dialog
        id={id}
        appendTo={'self'}
        header={title ? <div className={'text-center'}>{title}</div> : undefined}
        showHeader={title && 0 < title.length}
        visible={display}
        position={position}
        onHide={() => {
            if (!canHide || !display) return; setDisplay(false);
        }}
        modal={false}
        draggable={true}
        resizable={true}
        maximizable={maximizable ?? false}
        closable={canHide}
        showCloseIcon={canHide}
        style={{ ...(style ?? {}), ...dimensions, position: 'absolute' }}
    >
        {content}
    </Dialog>
}