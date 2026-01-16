import React from 'react'
import { CompanyMetadata } from './CompanyTypes';
import { PersistenceClass } from '../../dashboardcomponents/persistence';

import { ServiceStatus } from "../../statusAPIs/statustypes";
import { setServiceStatus, getDependentServiceStatuses } from "../../statusAPIs/servicestatuscache";
import { reactToHTMLString } from "../../common/ui/reactTrustedHtmlString";
import {
    OutageBreakdown,
    CompanyOutageBreakdownMap,
    mapCompanyToOutageBreakdown,
    breakdownDataToString
} from "../../geoblackout/outageBreakdownAPItypes";
import { DependentServiceListingComponent } from "../../statusAPIs/ui/DependentServiceListing";
import { OutageBreakdownComponent } from "../../geoblackout/ui/OutageBreakdown";

export interface OnExternalDataUpdates {
    onServiceStatus: (serviceStatus: ServiceStatus[]) => void
    onOutageBreakdowns: (serviceOutages: OutageBreakdown[]) => void
}

export function createOnExternalDataUpdates(
    companyCards: CompanyMetadata[],
    persistence: PersistenceClass
): OnExternalDataUpdates {
    const onServiceStatus = (serviceStatus: ServiceStatus[]) => {
        setServiceStatus(serviceStatus)

        companyCards.forEach(card => {
            const serviceStatuses = getDependentServiceStatuses(card.companyName)
            if (serviceStatuses) {
                card.renderable.firstElementChild.innerHTML = reactToHTMLString(
                    <DependentServiceListingComponent serviceStatuses={serviceStatuses} />
                )
            }
        })
    }
    const onOutageBreakdowns = (serviceOutages: OutageBreakdown[]) => {
        const companyServiceMap: CompanyOutageBreakdownMap = mapCompanyToOutageBreakdown(
            companyCards.map(({ companyName }) => companyName),
            serviceOutages
        )
        let outageMatchCount = 0
        companyCards.forEach(card => {
            const service: OutageBreakdown | undefined = companyServiceMap[card.companyName]
            if (service) {
                outageMatchCount = outageMatchCount + 1
                card.displayLinesArray = [
                    `${card.companyName}`,
                    ...service.data.map(breakdownDataToString)
                ]
                card.displayLines = () => card.displayLinesArray
                card.renderable.lastElementChild.innerHTML = reactToHTMLString(
                    <OutageBreakdownComponent service={service} />
                )
            }
        })
        if (outageMatchCount < serviceOutages.length) {
            const matchedOutages = Object.values(companyServiceMap).map(({ service }) => service)
            const unmatchedOutages = serviceOutages.map(({ service }) => service).filter(outage => !matchedOutages.includes(outage))
            console.log(`onOutageBreakdowns> ${outageMatchCount}/${serviceOutages.length} matched. Unmatched OutageBreakdowns: [${unmatchedOutages.join(',')}]`)
        }
        if (0 < outageMatchCount) {
            persistence.storeDashboard(Date.now(), companyCards)
        }
    }
    return {
        onServiceStatus,
        onOutageBreakdowns,
    }
}