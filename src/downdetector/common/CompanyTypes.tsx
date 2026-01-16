import React from 'react'
import { Card, FilterableItems, ItemFilter, toCardIndex } from '../../dashboardcomponents/datatypes';
import { PersistenceClass, StaleDuration } from '../../dashboardcomponents/persistence';
import { toTitleCase } from '../../common/functions';
import { CompanyTitle } from './CompanyTitle';
import { reactToHTMLString } from '../../common/ui/reactTrustedHtmlString';

export const HealthLevelTypes = ['danger', 'warning', 'success'] as const;
export type HealthLevelType = (typeof HealthLevelTypes)[number];

export const CompanyPageTypes = ['dashboard', 'status', 'map'] as const;
export type CompanyPageType = (typeof CompanyPageTypes)[number];

export const sortingFields = ['level', 'groupName', 'incidentRisk'];
export const filterableItems: FilterableItems = {
  level: {
    field: 'level',
    type: 'ValueExistence',
    filter: {
      danger: true,
      warning: true,
      success: true
    }
  } as ItemFilter
}

export type CompanyPageInfo = {
  dashboard: {
    href: string
    elementId: string
  }
} & {
  [pageType in CompanyPageType]: {
    href: string,
  };
}
export interface IncidentReports {
  baseline15minAvg: number
  pastHr15minAvg: number
  incidentRiskFactor: number
}
export interface CompanyMetadata extends Card {
  timestamp: number;
  rank: number;
  level: HealthLevelType;
  companyName: string;
  incidentReports?: IncidentReports;
  incidentRisk: number
  pageInfo: CompanyPageInfo
  displayLinesArray: string[]
}

export const toCard = (elementId: string, pageName: string, companies: CompanyMetadata[] | undefined): CompanyMetadata | null => {
  const index = toCardIndex(elementId, pageName, companies)
  return index === null ? companies[index] : null
}

export interface CompanyStatusCard {
  renderable: HTMLElement;
  companyName: string;
  company?: CompanyMetadata;
  allCompanies?: CompanyMetadata[];
}

function toCompanyMetadataCard(data: Partial<CompanyMetadata>): CompanyMetadata {
  const metadata: Partial<CompanyMetadata> = {}
  metadata.timestamp = data.timestamp ?? Date.now()
  metadata.rank = data.rank ?? 0
  metadata.level = data.level ?? 'success'
  metadata.companyName = data.companyName ?? ''

  metadata.incidentReports = data.incidentReports
  metadata.pageInfo = data.pageInfo ?? {
    ['dashboard']: {
      href: 'https://downdetector.com/',
      elementId: ''
    },
    ['status']: {
      href: '',
    },
    ['map']: {
      href: '',
    }
  }
  metadata.incidentRisk = data.incidentRisk ?? 0
  metadata.renderable = data.renderable ?? null
  metadata.displayLinesArray = [...(data.displayLinesArray ?? [])]

  metadata.displayLines = () => metadata.displayLinesArray
  metadata.groupName = metadata.companyName
  metadata.label = () => `#${metadata.rank} ${metadata.companyName}`
  metadata.color = () => metadata.level === 'danger' ? 'red' : metadata.level === 'warning' ? 'yellow' : 'lightblue'
  metadata.href = (pageName: string) => metadata.pageInfo[pageName].href
  return metadata as CompanyMetadata

}
export function toDisplayLines(company: CompanyMetadata, newLines: string[] = []): string[] {
  const nullIncidentReports = Object.values(company.incidentReports).every(v => -1 === v)
  if (nullIncidentReports) {
    console.log(`Warning: ${company.companyName} - has null IncidentReports`)
  }
  return [
    company.companyName,
    ...(nullIncidentReports ? [] : [`IncidentRiskFactor: ${company.incidentReports.incidentRiskFactor}`]),
    ...newLines.map(t => t.trim()),
    ...(nullIncidentReports
      ? ['missing incident data']
      : [`Incident Spike: ${company.incidentReports.pastHr15minAvg}`,
        `Incident Baseline: ${company.incidentReports.baseline15minAvg}`,
      ]
    )
  ]
}
export const getWrappedCompanyTitleDiv = (wrappedCompanyDiv: HTMLElement): HTMLElement => {
  return wrappedCompanyDiv.firstElementChild as HTMLElement
}
export const getWrappedCompanyServiceInfoDiv = (wrappedCompanyDiv: HTMLElement): HTMLElement => {
  return getWrappedCompanyTitleDiv(wrappedCompanyDiv).nextElementSibling as HTMLElement
}
export const getWrappedCompanyCompanyDiv = (wrappedCompanyDiv: HTMLElement): HTMLElement => {
  return getWrappedCompanyServiceInfoDiv(wrappedCompanyDiv).nextElementSibling as HTMLElement
}
export const getWrappedCompanyBreakdownDiv = (wrappedCompanyDiv: HTMLElement): HTMLElement => {
  return wrappedCompanyDiv.lastElementChild as HTMLElement
}
export
  function toCompanyInfo(
    timestamp: number,
    rank: number,
    companyDiv: HTMLElement,
  ): CompanyMetadata {
  const svg = companyDiv.querySelector('svg');
  const statusAnchor = companyDiv.querySelector('a')!;

  const level = svg.classList[0] as HealthLevelType;
  const companyName = statusAnchor.innerText.trim();
  const pastHourIncidentTotal = parseInt(companyDiv.dataset.hour)
  const pastDayIncidentTotal = parseInt(companyDiv.dataset.day)
  let incidentReports: IncidentReports | undefined = undefined
  let incidentRiskFactor = 0
  if (!isNaN(pastHourIncidentTotal) && !isNaN(pastDayIncidentTotal)) {
    const baseline15minAvg = Math.trunc(pastDayIncidentTotal / 96)
    const pastHr15minAvg = Math.trunc(pastHourIncidentTotal / 4)
    incidentRiskFactor = Math.floor(Math.abs(pastHr15minAvg-baseline15minAvg)/baseline15minAvg)
    incidentReports = {
      baseline15minAvg,
      pastHr15minAvg,
      incidentRiskFactor
    }
  } else {
    console.error(`${companyName} has empty dataset hour/day hour(${companyDiv.dataset.hour}) day(${companyDiv.dataset.day})`)
  }
  const wrappedCompanyDivId = `${companyDiv.id}-wrapped`
  const wrappedCompanyDivTitleId = `${companyDiv.id}-title`
  const wrappedCompanyDivServiceInfoId = `${companyDiv.id}-serviceinfo`
  const wrappedCompanyDivBreakdownId = `${companyDiv.id}-breakdown`
  const pageInfo: CompanyPageInfo = {
    ['dashboard']: {
      href: 'https://downdetector.com/',
      elementId: wrappedCompanyDivId
    },
    ['status']: {
      href: statusAnchor.href,
    },
    ['map']: {
      href: `${statusAnchor.href}map/`,
    }
  }
  const wrappedCompanyDiv = document.createElement('div')
  const titleDisplayDiv = document.createElement('div')
  const serviceInfoDisplayDiv = document.createElement('div')
  const breakdownDisplayDiv = document.createElement('div')
  wrappedCompanyDiv.id = wrappedCompanyDivId

  titleDisplayDiv.id = wrappedCompanyDivTitleId
  wrappedCompanyDiv.appendChild(titleDisplayDiv)

  serviceInfoDisplayDiv.id = wrappedCompanyDivServiceInfoId
  serviceInfoDisplayDiv.style.float = 'right'
  wrappedCompanyDiv.appendChild(serviceInfoDisplayDiv)

  wrappedCompanyDiv.appendChild(companyDiv)

  breakdownDisplayDiv.id = wrappedCompanyDivBreakdownId
  breakdownDisplayDiv.style.display = 'flex'
  breakdownDisplayDiv.style.float = 'inline-end'
  wrappedCompanyDiv.appendChild(breakdownDisplayDiv)


  const nullIncidentReports = [null, undefined].includes(incidentReports) || Object.values(incidentReports).some(value => null === value)
  incidentReports = nullIncidentReports ? { baseline15minAvg: -1, pastHr15minAvg: -1, incidentRiskFactor: -1 } : incidentReports
  const company: Partial<CompanyMetadata> = {
    timestamp,
    rank,
    level,
    companyName,
    incidentReports,
    pageInfo,
    incidentRisk: incidentRiskFactor < 0 /*nullreport*/ ? 0 : incidentRiskFactor,
    renderable: wrappedCompanyDiv,
  }
  getWrappedCompanyTitleDiv(company.renderable).innerHTML = reactToHTMLString(
    <CompanyTitle
      titleType={'card'}
      company={company as CompanyMetadata}
    />
  )
  return toCompanyMetadataCard({
    ...company,
    displayLinesArray: toDisplayLines(company as CompanyMetadata)
  })
}

export const dashboardCardsQueryAllSelector = 'div[class*="company-index"]'

export function processCompanyDashboardCards(
  cardElements: HTMLElement[],
  persistence: PersistenceClass
): CompanyMetadata[] {
  const timestamp = Date.now();
  const result = cardElements.map((element, index) =>
    toCompanyInfo(timestamp, index + 1, element),
  );
  persistence.storeDashboard(
    timestamp,
    result
  );
  return result;
}

export const statusElementId = 'chart-row'
export const statusMapElementId = 'map_container'

export function processCompanyStatus(
  pageType: CompanyPageType,
  statusElement: HTMLElement,
  statusHref: string,
  persistence: PersistenceClass
): CompanyStatusCard {
  const timestamp = Date.now();
  const cards = persistence.loadDashboard<CompanyMetadata>(timestamp - StaleDuration);
  const result: Partial<CompanyStatusCard> = {
    renderable: statusElement,
  };
  if (cards) {
    result.allCompanies = cards.map(toCompanyMetadataCard);
    const foundCompany = result.allCompanies.find(
      (company) => company.pageInfo[pageType].href === statusHref,
    );
    if (foundCompany) {
      result.companyName = foundCompany.companyName;
      result.company = foundCompany;
    }
  }
  if (!result.companyName) {
    result.companyName = toTitleCase(
      statusHref
        .split('/')
        .filter((item) => 0 < item.length)
        .slice(-1)[0]!
        .split('-')
        .join(' '),
    );
  }
  return result as CompanyStatusCard;
}

