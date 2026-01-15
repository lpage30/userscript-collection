import React, { JSX, CSSProperties } from "react";
import "../../common/ui/styles.scss";
import { OutageBreakdownData } from "../outageBreakdownAPItypes";

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
        ><b>{outageBreakdownData.type}</b> {`${outageBreakdownData.percentage}`}%({`${outageBreakdownData.alertCount}`})</div>
    )
}