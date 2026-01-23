import React, { useRef } from "react";
import "../../common/ui/styles.scss";
import {
  CompanyStatusCard,
  CompanyMetadata,
  CompanyPageType,
} from "../common/CompanyTypes";
import { Card, FilterableItems } from "../../dashboardcomponents/datatypes";
import { createFeatures } from "../../dashboardcomponents/OptionalFeatures";
import { Dashboard } from "../../dashboardcomponents/Dashboard";
import { PersistenceClass } from "../../dashboardcomponents/persistence";
import { toCompanyTitleText } from "../common/CompanyTitle";
import { createOnExternalDataUpdates } from "../common/onexternaldataupdate";
import { ServiceDashboardPopupAndSummary } from "../../statusAPIs/ui/ServiceDashboard";
import { LoadOutageBreakdowns } from "../../geoblackout/ui/LoadOutageBreakdowns";

interface CompanyStatusProps {
  persistence: PersistenceClass
  pageTypes: string[]
  page: CompanyPageType
  filterableItems: FilterableItems
  sortingFields: string[]
  company: CompanyStatusCard;
}
export const CompanyStatus: React.FC<CompanyStatusProps> = ({
  persistence,
  pageTypes,
  filterableItems,
  sortingFields,
  company,
  page
}) => {
  const displayedCards = useRef<CompanyMetadata[]>(null)
  const rerenderAndFocus = useRef<(focusOnCard?: Card) => void>(null)
  const render = () => {
    const features = createFeatures(() => persistence, {
      picklist: {
        pageTypes: [...pageTypes],
        usingPage: page
      },
      infoDisplay: {
        infoDisplayRowSpan: 2,
        textPaddingLeft: { value: 0.5, type: 'rem' }
      },
      filterSort: {
        getFilterableItems: () => filterableItems,
        sortingFields
      }
    })

    const { onServiceStatus, onOutageBreakdowns } = createOnExternalDataUpdates([company.company, ...(displayedCards.current ?? [])], persistence)
    return (
      <Dashboard
        title={toCompanyTitleText(company.company, `DownDetector ${page == 'status' ? 'Status' : 'Heatmap'}:`)}
        getCards={() => company.allCompanies}
        contentLayout={{
          type: 'Element',
          properties: {
            id: 'company-status',
            renderable: {
              card: company.company,
              getRenderable: () => company.renderable,
              onClick: (card: Card) => {
                const company = card as CompanyMetadata
                window.location.href = company.pageInfo[page === 'status' ? 'map' : 'status'].href
              }
            }
          }
        }}
        modal={true}
        features={features}
        onDisplayedCards={cards => displayedCards.current = cards.map(c => c as CompanyMetadata)}
        registerRerenderFunction={rerenderFunction => { rerenderAndFocus.current = rerenderFunction }}
        addedHeaderComponents={[
          {
            after: 'lastrow',
            element: <LoadOutageBreakdowns
              onOutageBreakdowns={(outages) => {
                onOutageBreakdowns(outages)
                const foundCompany = (displayedCards.current ?? []).find(({ companyName }) => companyName === company.company?.companyName)
                company.company = foundCompany ?? company.company
                if (rerenderAndFocus.current) rerenderAndFocus.current(company.company)
              }}
            />
          },
          {
            after: 'lastrow',
            element: <ServiceDashboardPopupAndSummary
              onServiceStatus={onServiceStatus}
              companyHealthStatuses={(displayedCards.current ?? []).map(({ companyName, level }) => ({ companyName, healthStatus: level }))}
              isolatedCompanyNames={[company.companyName]}
            />
          },
        ]}
      />
    )
  }
  return render();
};