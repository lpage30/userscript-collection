import React from "react";
import "../../common/ui/styles.scss";
import { OutageBreakdown } from "../outageBreakdownAPItypes";
import { OutageBreakdownDataDiv } from "./OutageBreakdownDataDiv";

interface OutageBreakdownComponentProps {
    service: OutageBreakdown
}

export const OutageBreakdownComponent: React.FC<OutageBreakdownComponentProps> = ({
    service
}) => {
    return (
        <>
            {service.data.map(item => (OutageBreakdownDataDiv(item, 0, 3)))
            }
        </>
    )
}