import React, { JSX, CSSProperties } from "react";
import "../../common/ui/styles.scss";
import { OutageBreakdownData, breakdownDataToElement } from "../outageBreakdownAPItypes";

export function OutageBreakdownDataDiv(
    outageBreakdownData: OutageBreakdownData,
    paddingLeft: number,
    paddingRight: number,
): JSX.Element {
    const style: CSSProperties = {
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`
    }
    return (
        <div
            className="text-sm"
            style={style}
        >{breakdownDataToElement(outageBreakdownData)}</div>
    )
}