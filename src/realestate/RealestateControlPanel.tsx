import React, { useRef, useState, JSX, useEffect } from 'react'
import "../common/ui/styles.scss";
import { PropertyInfoCard } from './PropertyInfoCard';
import { Button } from 'primereact/button';
import { ControlPanel } from '../common/ui/control_panel'
import { AddedHeaderComponent } from '../dashboardcomponents/Dashboard';
import { toPropertyCardDashboardComponent } from './PropertyInfoCard';
import { DashboardPopup } from '../dashboardcomponents/DashboardPopup';
import { createSpinningContentElement } from '../common/ui/style_functions'
import { ScrapedProperties } from './realestatesitetypes';
import { toRealestateDashboardFeatures } from './realestate_features';

interface RealestateControlPanelProps {
    id: string
    siteName: string
    title: string
    toggleMapDisplay: (parentElement?: HTMLElement) => void
    scrapedProperties: ScrapedProperties
    containsOlderResults: boolean
    loadProperties?: (force: boolean, includeOlderResults?: boolean) => Promise<ScrapedProperties>
}
export const RealestateControlPanel: React.FC<RealestateControlPanelProps> = ({
    id,
    siteName,
    title,
    toggleMapDisplay,
    scrapedProperties,
    containsOlderResults,
    loadProperties
}) => {
    const [state, setState] = useState<{
        isLoadingProperties: boolean,
        scrapedProperties: ScrapedProperties
    }>({
        isLoadingProperties: false,
        scrapedProperties,
    })
    useEffect(() => {

    }, [state])

    const refreshDashboard = useRef(null)
    const toggleMapTitle = 'Toggle Map Display'

    const reloadProperties = async (issueRefreshDashboard: boolean, includeOlderResults?: boolean) => {
        if (undefined === loadProperties) return
        setState({ ...state, isLoadingProperties: true })
        const newProperties = await loadProperties(true, includeOlderResults)
        setState({
            isLoadingProperties: false,
            scrapedProperties: newProperties
        })
        if (issueRefreshDashboard && refreshDashboard.current) refreshDashboard.current()
    }
    const getMapButton = (getParentElement?: () => HTMLElement): JSX.Element => {
        if (0 < state.scrapedProperties.properties.length && state.scrapedProperties.properties[0].createMapButton) {
            return state.scrapedProperties.properties[0].createMapButton(toggleMapTitle, () => toggleMapDisplay(getParentElement ? getParentElement() : undefined))
        }
        return (
            <Button
                className="app-button"
                onClick={() => toggleMapDisplay(getParentElement ? getParentElement() : undefined)}
            >{toggleMapTitle}</Button>
        )
    }

    const getReloadPropertiesButton = (usage: 'dashboard' | 'controlpanel', includeOlderResults?: boolean): JSX.Element => {
        const propertyListingType = `${includeOlderResults === true ? 'All (old & new)' : containsOlderResults ? 'Most Recent' : ''} Properties`.trim()
        let loadPropertiesButtonContent: string | JSX.Element = `Reload ${propertyListingType}`
        if (state.isLoadingProperties) {

            loadPropertiesButtonContent = createSpinningContentElement({
                popupElementType: 'NoPopup',
                spinnerSize: 'small',
                content: {
                    content: `Reloading ${propertyListingType}`
                }
            })
        }
        return <Button
            className={'app-button'}
            onClick={() => reloadProperties('dashboard' === usage, includeOlderResults)}
            disabled={state.isLoadingProperties}>{loadPropertiesButtonContent}</Button>
    }
    const getContent = () => {
        const dashboardTitle = `${title} (${state.scrapedProperties.properties.length}) ${containsOlderResults ? (state.scrapedProperties.containsOlderResults ? '(old and new)' : ('most recent')) : ''}`.trim()
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
                        {1 < state.scrapedProperties.properties.length &&
                            <tr><td style={{ padding: 0, margin: 0 }} className={'text-center'}><DashboardPopup
                                dashboardShortName={dashboardTitle}
                                dashboardProps={{
                                    title: dashboardTitle,
                                    getCards: () => state.scrapedProperties.properties,
                                    contentLayout: {
                                        type: 'Card',
                                        properties: {
                                            layout: 'grid-2',
                                            cardStyle: { height: '520px', width: '600px' },
                                            toCardComponent: toPropertyCardDashboardComponent
                                        }
                                    },
                                    onClose: () => setState({ ...state, scrapedProperties: { ...scrapedProperties } }),
                                    features: toRealestateDashboardFeatures(siteName, state.scrapedProperties.properties),
                                    registerRerenderFunction: (rerenderFunction) => {
                                        refreshDashboard.current = rerenderFunction
                                    },
                                    addedHeaderComponents: loadProperties
                                        ? [
                                            {
                                                after: 'picklist',
                                                element: getReloadPropertiesButton('dashboard')

                                            } as AddedHeaderComponent,
                                            containsOlderResults === true
                                                ? {
                                                    after: 'picklist',
                                                    element: getReloadPropertiesButton('dashboard', true)
                                                } as AddedHeaderComponent
                                                : undefined
                                        ].filter(a => ![undefined, null].includes(a))
                                        : undefined
                                }}
                            />
                            </td></tr>
                        }
                        {1 === state.scrapedProperties.properties.length &&
                            <>
                                <tr><td style={{ padding: 0, margin: 0 }} className={'text-center'}><PropertyInfoCard id={`${id}-info`} info={state.scrapedProperties.properties[0]} usage={'controlpanel'} /></td></tr>
                            </>
                        }
                        <tr><td style={{ padding: 5, margin: 0 }} className={'text-center'}>{getMapButton()}</td></tr>
                        {loadProperties && <tr><td style={{ padding: 5, margin: 0 }} className={'text-center'}>{getReloadPropertiesButton('controlpanel')}</td></tr>}
                        {loadProperties && containsOlderResults === true && <tr><td style={{ padding: 5, margin: 0 }} className={'text-center'}>{getReloadPropertiesButton('controlpanel', true)}</td></tr>}
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
