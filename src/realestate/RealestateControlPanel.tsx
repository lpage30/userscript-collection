import React, { ReactNode, useRef, useState, BaseSyntheticEvent } from 'react'
import { PropertyInfo } from './propertyinfotypes';
import { PropertyInfoCard } from './PropertyInfoCard';
import { Button } from 'primereact/button';
import { ControlPanel } from '../common/ui/control_panel'
import { ListedPropertyDashboardPopup, ListedPropertyContainerId } from './ListedPropertyDashboard';

interface RealestateControlPanelProps {
    id: string
    siteName: string
    title: string
    toggleMapDisplay: (parentElement?: HTMLElement) => void
    properties: PropertyInfo[]
    ignoreDashboardClickEvent?: (e: BaseSyntheticEvent) => boolean
}
export const RealestateControlPanel: React.FC<RealestateControlPanelProps> = ({
    id,
    siteName,
    title,
    toggleMapDisplay,
    properties,
    ignoreDashboardClickEvent
}) => {
    const [state, setState] = useState<PropertyInfo[]>(properties)
    const closeListing = useRef(null)
    const toggleMapTitle = 'Toggle Map Display'

    const getMapButton = (getParentElement?: () => HTMLElement): ReactNode => {
        if (0 < state.length && state[0].createMapButton) {
            return state[0].createMapButton(toggleMapTitle, () => toggleMapDisplay(getParentElement ? getParentElement() : undefined))
        }
        return (
            <Button
                className="app-button"
                onClick={() => toggleMapDisplay(getParentElement ? getParentElement() : undefined)}
            >{toggleMapTitle}</Button>
        )
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
                        {1 < state.length &&
                            <tr><td style={{ padding: 0, margin: 0 }} className={'text-center'}><ListedPropertyDashboardPopup
                                title={`${title} (${state.length})`}
                                siteName={siteName}
                                properties={state}
                                onDashboardClose={() => setState([...properties])}
                                registerClose={(closeDashboard: () => void) => {
                                    closeListing.current = closeDashboard
                                }}
                                ignoreDashboardClickEvent={ignoreDashboardClickEvent}
                                addedDashboardHeaderComponent={{
                                    after: 'picklist',
                                    element: <div style={{ display: 'flex' }}>
                                        <Button
                                            className="app-button"
                                            onClick={() => { if (closeListing.current) closeListing.current() }}
                                        >Close Listing</Button>
                                    </div>
                                }}
                            /></td></tr>
                        }
                        {1 === state.length &&
                            <tr><td style={{ padding: 0, margin: 0 }} className={'text-center'}><PropertyInfoCard id={`${id}-info`} info={state[0]} usage={'controlpanel'}/></td></tr>
                        }
                        <tr><td style={{ padding: 5, margin: 0 }} className={'text-center'}>{getMapButton()}</td></tr>
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
