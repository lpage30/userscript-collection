import React from 'react'
import { OutageBreakdown, OutageBreakdownGraphDimensions } from '../outageBreakdownAPItypes'
import { OutageBreakdownListingComponent } from './OutageBreakdownListing'
import { toMonthDayYearDateTime } from '../../common/datetime'
import { companyHealthStatusToMultirowElement } from '../../common/ui/CompanyHealthStatusComponents'
import { DependentServiceListingComponent } from '../../statusAPIs/ui/DependentServiceListing'
import { CompanyHealthStatus } from '../../common/CompanyHealthStatus'
import { OutageBreakdownGraph } from './OutageBreakdownGraph'

interface OutageBreakdownComponentProps {
    outageBreakdown: OutageBreakdown
    companyHealthStatuses?: CompanyHealthStatus[]
}

export const OutageBreakdownComponent: React.FC<OutageBreakdownComponentProps> = ({
    outageBreakdown,
    companyHealthStatuses
}) => {
    const companyStatus = (companyHealthStatuses ?? []).find(company => company.outageBreakdownService && company.outageBreakdownService.service === outageBreakdown.service)

    return (<div style={{
        width: '100%',
        margin: '0 auto',
    }}>

        <div style={{ paddingLeft: '10px' }}>
            <div style={{ display: 'flex' }}>
                <h3><a href={outageBreakdown.serviceHref}>{outageBreakdown.service}</a></h3>
                <span style={{ paddingTop: '5px', paddingLeft: '10px' }}>{toMonthDayYearDateTime(outageBreakdown.timestamp)}</span>
            </div>
            <OutageBreakdownListingComponent service={outageBreakdown} />
            {outageBreakdown.blurb.split('\n').map((line, index) => (<p style={0 === index ? { paddingTop: '10px' } : {}}>{line}</p>))}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h6>Reported outages in the last 24 hours{companyStatus && (' with Downdetector overlay')}</h6>
                <div style={{ position: 'relative', width: `${OutageBreakdownGraphDimensions.width}px`, height: `${OutageBreakdownGraphDimensions.height}px` }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                        <OutageBreakdownGraph graphData={outageBreakdown.graphData} />
                    </div>
                    {companyStatus && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}>
                            {companyStatus.graphSvgSparkline(OutageBreakdownGraphDimensions)}
                        </div>
                    )}
                </div>
                {companyStatus && (
                    <div style={{ display: 'flex' }}>
                        <div style={{ float: 'left' }}>
                            {companyHealthStatusToMultirowElement(companyStatus).getElement(true, true)}
                        </div>
                        {0 < (companyStatus.dependentServiceStatuses ?? []).length && (<>
                            <div>&nbsp;&nbsp;</div>
                            <div style={{ float: 'right' }}>
                                <DependentServiceListingComponent serviceStatuses={companyStatus.dependentServiceStatuses} />
                            </div>
                        </>)}
                    </div>
                )}
            </div>

        </div>
    </div>)
}

