import React from 'react'
import { OutageBreakdown } from '../outageBreakdownAPItypes'
import { OutageBreakdownListingComponent } from './OutageBreakdownListing'
import { toMonthDayYearDateTime } from '../../common/datetime'

interface OutageBreakdownComponentProps {
    outageBreakdown: OutageBreakdown
}

export const OutageBreakdownComponent: React.FC<OutageBreakdownComponentProps> = ({
    outageBreakdown
}) => {

    return (<div style={{
        width: '100%',
        margin: '0 auto',
    }}>
        <div>
            <div style={{ display: 'flex', padding: '10px', alignItems: 'center' }}>
                <h3 style={{ paddingRight: '10px' }}><a href={outageBreakdown.serviceHref}>{outageBreakdown.service}</a></h3>
                <OutageBreakdownListingComponent service={outageBreakdown} />
                <span>{toMonthDayYearDateTime(outageBreakdown.timestamp)}</span>
            </div>
            {outageBreakdown.blurb.split('\n').map(line => (<p>{line}</p>))}
        </div>
    </div>)
}

