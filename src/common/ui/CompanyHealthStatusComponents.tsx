import React, { CSSProperties, JSX } from 'react'
import { MultirowArrayItem } from './multirow_element'
import { CompanyHealthStatus, HealthLevelType, CompanyHealthLevelTypeInfoMap, toCompanyTitleText } from '../CompanyHealthStatus'

export function CompanyHealthStatusSpan(
    companyName: string,
    status: HealthLevelType,
    paddingLeft: number,
    paddingRight: number,
    useDivInstead: boolean = false,
    onClick?: () => void
): JSX.Element {
    const { bgColor, fgColor } = CompanyHealthLevelTypeInfoMap[status]
    const style: CSSProperties = {
        backgroundColor: bgColor,
        color: fgColor,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`
    }
    return useDivInstead
        ? <div style={style} onClick={onClick}>{companyName}</div>
        : <span style={style} onClick={onClick}>{companyName}</span>
}

export const companyHealthStatusToMultirowElement = (healthStatus: CompanyHealthStatus): MultirowArrayItem => ({
    id: healthStatus.companyName.toString(),
    getElement: (isFirst: boolean, isLast: boolean, onClick?: () => void) => (<>
        {!isFirst && <span>&nbsp;&#x2022;&nbsp;</span>}
        {CompanyHealthStatusSpan(
            toCompanyTitleText(healthStatus),
            healthStatus.level,
            !isFirst ? 5 : 3,
            !isLast ? 5 : 3,
            false,
            onClick
        )}
    </>)
})