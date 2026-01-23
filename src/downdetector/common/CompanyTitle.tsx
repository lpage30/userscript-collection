import React from 'react'
import { CompanyMetadata } from './CompanyTypes'

export function toCompanyTitleText(company: CompanyMetadata, prefix?: String, suffix?: string): string {
    return `${prefix ?? ''} ${company.companyName} (RiskFactor: ${company.incidentRisk}) ${suffix ?? ''}`.trim()
}

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
    const titleText = toCompanyTitleText(company, prefix, suffix)
    switch (titleType) {
        case 'page': return <h2>{titleText}</h2>
        case 'card': return <h6>{titleText}</h6>
        default: return titleText
    }
}