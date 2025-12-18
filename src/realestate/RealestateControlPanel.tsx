import React, {ReactNode} from 'react'
import { PropertyInfo } from './realestate_site';
import { PropertyInfoCard } from './PropertyInfoCard';
import { Button } from 'primereact/button';
import { ControlPanel } from '../common/ui/control_panel'

interface RealestateControlPanelProps {
    id: string
    title?: string
    toggleMapDisplay: () => void
    propertyInfo?: PropertyInfo
}
export const RealestateControlPanel: React.FC<RealestateControlPanelProps> = ({
    id,
    title = "Realestate Userscript",
    toggleMapDisplay,
    propertyInfo,
}) => {
    const toggleMapTitle = 'Toggle Map Display'
    const getMapButton = (): ReactNode => {
        if (propertyInfo && propertyInfo.createMapButton) {
            return propertyInfo.createMapButton(toggleMapTitle, toggleMapDisplay)
        }
        return (
            <Button
                className="app-button"
                onClick={toggleMapDisplay}
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
                marginBottom: 'auto',
                padding: 0,
            }}
            ><tbody> {propertyInfo && <>
                    <tr><td style={{padding: 0, margin: 0}} className={'text-center'}><PropertyInfoCard id={`${id}-info`} info={propertyInfo} /></td></tr>
                    <tr><td style={{padding: 0, margin: 0}} className={'text-center'}>{getMapButton()}</td></tr>
                </>}
                {propertyInfo === undefined && 
                    <tr><td style={{padding: 0, margin: 0}} className={'text-center'}>{getMapButton()}</td></tr>
                }
            </tbody></table>
        )
    }

return <ControlPanel
    id={id}
    title={title}
    visible={true}
    canHide={false}
    position={'top-right'}
    style={{ margin: '50px' }}
    content={getContent()} />
}
