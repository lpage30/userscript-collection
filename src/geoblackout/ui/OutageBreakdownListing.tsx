import React, { JSX, CSSProperties } from "react";
import "../../common/ui/styles.scss";
import { OutageBreakdown } from "../outageBreakdownAPItypes";
import { OutageBreakdownDataDiv } from "./OutageBreakdownDataDiv";

interface OutageBreakdownListingComponentProps {
    service: OutageBreakdown
}

export const OutageBreakdownListingComponent: React.FC<OutageBreakdownListingComponentProps> = ({
    service
}) => {
    return (
        <>{
            service.data.map(item => (OutageBreakdownDataDiv(item, 0, 3)))
        }</>
    )
}

export function OutageBreakdownSpan(
    breakdown: OutageBreakdown,
    paddingLeft: number,
    paddingRight: number,
    useDivInstead: boolean = false,
    onClick?: () => void
): JSX.Element {
    const style: CSSProperties = {
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`
    }
    return useDivInstead
        ? <div className="text-sm" style={style} onClick={onClick}>{breakdown.service}</div>
        : <span className="text-sm" style={style} onClick={onClick}>{breakdown.service}</span>
}
