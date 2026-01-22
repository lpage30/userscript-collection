import React from 'react'
import { CompanyMetadata } from './CompanyTypes'
import { CompanyTitle } from './CompanyTitle'
import { DependentServiceListingComponent } from '../../statusAPIs/ui/DependentServiceListing'
import { OutageBreakdownComponent } from '../../geoblackout/ui/OutageBreakdown'
import { CompanyDownDetectorCard } from './CompanyDownDetectorCard'
import { reactToHTMLElement } from '../../common/ui/renderRenderable'
import { Card } from '../../dashboardcomponents/datatypes'

interface CompanyCardComponentProps {
  id: string
  company: CompanyMetadata
}
export const CompanyCardComponent: React.FC<CompanyCardComponentProps> = ({
  id,
  company
}) => {

  return (<div id={`${id}-wrapped`}>
    <div id={`${id}-wrapped-title`}>
      <CompanyTitle
        titleType={'card'}
        company={company as CompanyMetadata}
      />
    </div>
    <div id={`${id}-wrapped-serviceinfo`} style={{ float: 'right' }}>
      {0 < (company.dependentServiceStatuses ?? []).length && (
        <DependentServiceListingComponent serviceStatuses={company.dependentServiceStatuses} />
      )}
    </div>
    <CompanyDownDetectorCard id={`${id}-downdetector-card`} companyDivMetadata={company.companyDiv} />
    <div id={`${id}-wrapped-breakdown`} style={{ display: 'flex', float: 'inline-end' }}>
      {company.outageBreakdownService && (
        <OutageBreakdownComponent service={company.outageBreakdownService} />
      )}
    </div>
  </div>
  )
}
export function toCompanyCardComponent(card: Card): HTMLElement {
  return reactToHTMLElement(
    card.elementId,
    <CompanyCardComponent id={card.elementId} company={card as CompanyMetadata} />
  )
}

