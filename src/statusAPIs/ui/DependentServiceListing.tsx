import React from "react";
import "../../common/ui/styles.scss";
import { ServiceStatus } from "../statustypes";
import { sortServiceByStatusIndicatorRank } from "../statusService";
import { ServiceHealthStatusSpan } from "./IndicatorStatusComponents";

interface DependentServiceListingComponentProps {
    serviceStatuses: ServiceStatus[]
}

export const DependentServiceListingComponent: React.FC<DependentServiceListingComponentProps> = ({
    serviceStatuses
}) => {
    return (
        <>
            <div
                className="text-sm"
                style={{ paddingLeft: `0px`, paddingRight: `3px` }}
            >Dependent Services</div>
            {serviceStatuses
                .sort(sortServiceByStatusIndicatorRank)
                .map(status => (ServiceHealthStatusSpan(status, 0, 3, true)))
            }
        </>
    )
}