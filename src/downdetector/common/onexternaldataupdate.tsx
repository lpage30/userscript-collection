import React from 'react'
import { CompanyMetadata } from './CompanyTypes';
import { toDisplayLines } from './CompanyTypes_functions';
import { PersistenceClass } from '../../dashboardcomponents/persistence';

import { ServiceStatus } from "../../statusAPIs/statustypes";
import { setServiceStatus, getDependentServiceStatuses } from "../../statusAPIs/servicestatuscache";
import {
    OutageBreakdown,
    CompanyOutageBreakdownMap,
    mapCompanyToOutageBreakdown,
    breakdownDataToString
} from "../../geoblackout/outageBreakdownAPItypes";

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
            card.dependentServiceStatuses = getDependentServiceStatuses(card.companyName)
        })
    }
    const onOutageBreakdowns = (serviceOutages: OutageBreakdown[]) => {
        const companyServiceMap: CompanyOutageBreakdownMap = mapCompanyToOutageBreakdown(
            companyCards.map(({ companyName }) => companyName),
            serviceOutages
        )
        let outageMatchCount = 0
        companyCards.forEach(card => {
            card.outageBreakdownService = companyServiceMap[card.companyName]
            if (card.outageBreakdownService) {
                outageMatchCount = outageMatchCount + 1
                card.displayLinesArray = toDisplayLines(card, breakdownDataToString(card.outageBreakdownService.data))
                card.displayLines = () => card.displayLinesArray
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