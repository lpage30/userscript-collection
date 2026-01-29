import React, { CSSProperties } from 'react'
import { CompanyMetadata } from './CompanyTypes'
import { CompanyHealthLevelTypeInfoMap, toCompanyTitleText } from '../../common/CompanyHealthStatus'

interface CompanyTitleProps {
    titleType: 'page' | 'card' | 'text'
    company: CompanyMetadata
    prefix?: String
    suffix?: string
}

export const CompanyTitle: React.FC<CompanyTitleProps> = ({
    titleType,
    company,
    prefix,
    suffix,
}) => {
    const { bgColor, fgColor } = CompanyHealthLevelTypeInfoMap[company.level]
    const titleText = toCompanyTitleText(company, prefix, suffix)

    switch (titleType) {
        case 'page': return <h2 style={{ backgroundColor: bgColor, color: fgColor }}>{titleText}</h2>
        case 'card': return <h6 style={{ backgroundColor: bgColor, color: fgColor }}>{titleText}</h6>
        default: return titleText
    }
}