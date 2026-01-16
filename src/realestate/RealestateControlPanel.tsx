import React, { ReactNode, useRef, useState, BaseSyntheticEvent, JSX } from 'react'
import "../common/ui/styles.scss";
import { PropertyInfo } from './propertyinfotypes';
import { PropertyInfoCard } from './PropertyInfoCard';
import { Button } from 'primereact/button';
import { ControlPanel } from '../common/ui/control_panel'
import { ListedPropertyDashboardPopup } from './ListedPropertyDashboard';
import { createSpinningContentElement } from '../common/ui/style_functions'


interface RealestateControlPanelProps {
    id: string
    siteName: string
    title: string
    toggleMapDisplay: (parentElement?: HTMLElement) => void
    properties: PropertyInfo[]
    ignoreDashboardClickEvent?: (e: BaseSyntheticEvent) => boolean
    loadProperties?: (force: boolean) => Promise<PropertyInfo[]>
}
export const RealestateControlPanel: React.FC<RealestateControlPanelProps> = ({
    id,
    siteName,
    title,
    toggleMapDisplay,
    properties,
    ignoreDashboardClickEvent,
    loadProperties
}) => {
    const [state, setState] = useState<{
        isLoadingProperties: boolean,
        properties: PropertyInfo[]
    }>({
        isLoadingProperties: false,
        properties
    })
    const closeListing = useRef(null)
    const refreshDashboard = useRef(null)
    const toggleMapTitle = 'Toggle Map Display'

    const reloadProperties = async (issueRefreshDashboard: boolean) => {
        if (undefined === loadProperties) return
        setState({ ...state, isLoadingProperties: true })
        const newProperties = await loadProperties(true)
        setState({
            isLoadingProperties: false,
            properties: newProperties,
        })
        if (issueRefreshDashboard && refreshDashboard.current) refreshDashboard.current(true)
    }
    const getMapButton = (getParentElement?: () => HTMLElement): JSX.Element => {
        if (0 < state.properties.length && state.properties[0].createMapButton) {
            return state.properties[0].createMapButton(toggleMapTitle, () => toggleMapDisplay(getParentElement ? getParentElement() : undefined))
        }
        return (
            <Button
                className="app-button"
                onClick={() => toggleMapDisplay(getParentElement ? getParentElement() : undefined)}
            >{toggleMapTitle}</Button>
        )
    }

    const getReloadPropertiesButton = (usage: 'dashboard' | 'controlpanel'): JSX.Element => {
        let loadPropertiesButtonContent: string | JSX.Element = 'Reload Properties'
        if (state.isLoadingProperties) {

            loadPropertiesButtonContent = createSpinningContentElement({
                popupElementType: 'NoPopup',
                spinnerSize: 'small',
                content: {
                    content: 'Reloading Properties'
                }
            })
        }
        return <Button
            className={'app-button'}
            onClick={() => reloadProperties('dashboard' === usage)}
            disabled={state.isLoadingProperties}>{loadPropertiesButtonContent}</Button>
    }
    const getContent = () => {
        return (
            <table style={{
                tableLayout: 'auto',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: '0',
                marginBottom: '5pxs',
                padding: 5,
            }}
            ><tbody>
                    <>
                        {1 < state.properties.length &&
                            <tr><td style={{ padding: 0, margin: 0 }} className={'text-center'}><ListedPropertyDashboardPopup
                                title={`${title} (${state.properties.length})`}
                                siteName={siteName}
                                properties={state.properties}
                                onDashboardClose={() => setState({ ...state, properties: [...properties] })}
                                registerClose={(closeDashboard: () => void) => {
                                    closeListing.current = closeDashboard
                                }}
                                registerRefreshFunction={(refreshFunction: (showDialog: boolean) => void) => {
                                    refreshDashboard.current = refreshFunction
                                }}
                                ignoreDashboardClickEvent={ignoreDashboardClickEvent}
                                addedDashboardHeaderComponent={loadProperties ? {
                                    after: 'picklist',
                                    element: getReloadPropertiesButton('dashboard')

                                } : undefined}
                            /></td></tr>
                        }
                        {1 === state.properties.length &&
                            <tr><td style={{ padding: 0, margin: 0 }} className={'text-center'}><PropertyInfoCard id={`${id}-info`} info={state.properties[0]} usage={'controlpanel'} /></td></tr>
                        }
                        <tr><td style={{ padding: 5, margin: 0 }} className={'text-center'}>{getMapButton()}</td></tr>
                        {loadProperties && <tr><td style={{ padding: 5, margin: 0 }} className={'text-center'}>{getReloadPropertiesButton('controlpanel')}</td></tr>}
                    </>
                </tbody></table>
        )
    }

    return <ControlPanel
        id={id}
        title={title}
        visible={true}
        canHide={true}
        position={'top-right'}
        style={{ margin: '50px' }}
        content={getContent()} />
}
