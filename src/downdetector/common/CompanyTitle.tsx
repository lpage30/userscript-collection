import React from 'react'
import { CompanyMetadata } from './CompanyTypes'


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
    suffix
}) => {
    const titleText = `${prefix ?? ''} ${company.companyName} (RiskFactor: ${company.incidentRisk}) ${suffix ?? ''}`.trim()
    switch (titleType) {
        case 'page': return <h2>{titleText}</h2>
        case 'card': return <h6>{titleText}</h6>
        default: return titleText
    }
}