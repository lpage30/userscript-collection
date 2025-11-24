import { Card, FilterableItems, ItemFilter, toCardIndex } from '../../dashboardcomponents/datatypes';
import { PersistenceClass, StaleDuration } from '../../dashboardcomponents/persistence';
import { toTitleCase } from '../../common/functions';
import { toMonthDayYearDateTime } from '../../common/datetime';
import { ServiceStatus } from "../../statusAPIs/statustypes";
import { getServiceStatus, getDependentServiceStatuses } from '../../statusAPIs/servicestatuscache';

export const HealthLevelTypes = ['danger', 'warning', 'success'] as const;
export type HealthLevelType = (typeof HealthLevelTypes)[number];

export const CompanyPageTypes = ['dashboard', 'status', 'map'] as const;
export type CompanyPageType = (typeof CompanyPageTypes)[number];

export const sortingFields = ['level', 'companyName', 'incidentRisk' ];
export const filterableItems: FilterableItems = { level: { field: 'level', filter: { danger: true, warning: true, success: true }} as ItemFilter}

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
  incidentRiskPercent: number
}
export interface CompanyMetadata extends Card {
  timestamp: number;
  rank: number;
  level: HealthLevelType;
  companyName: string;
  incidentReports?: IncidentReports;
  incidentRisk: number
  pageInfo: CompanyPageInfo
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
  const nullIncidentReports = [null, undefined].includes(data.incidentReports) || Object.values(data.incidentReports).some(value => null === value)
  metadata.incidentReports = nullIncidentReports ? { baseline15minAvg: 0, pastHr15minAvg: 0, incidentRiskPercent: 0 } : data.incidentReports
  
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
  metadata.displayLines = () => {
    let result = [
      `${metadata.companyName}`
    ]
    const foundStatus = getServiceStatus(metadata.companyName)
    const foundDependentStatuses = getDependentServiceStatuses(metadata.companyName)
    if (nullIncidentReports && foundStatus === null && foundDependentStatuses === null) {
      console.log(`Warning: ${metadata.companyName} - has null IncidentReports`)
      return [
        ...result,
        'missing incident data'
      ]
    }
    if (foundStatus === null && foundDependentStatuses === null) {
      return [
        ...result,
        `Incident Spike: ${metadata.incidentReports.pastHr15minAvg}`,
        `Incident Baseline: ${metadata.incidentReports.baseline15minAvg}`,
        `IncidentRisk: ${metadata.incidentReports.incidentRiskPercent.toFixed(2)}%`
      ];
    }

    if (foundStatus) {
        result = [
        ...result,
        `Service Status: ${toMonthDayYearDateTime(foundStatus.status.timestamp)}`,
        `Status Indicator: ${foundStatus.status.indicator}`,
        `Activity: ${foundStatus.status.description}`,
      ];
    }

    if (foundDependentStatuses) {
        result = [
          ...result,
          ...(foundDependentStatuses.map(serviceStatus => ([
            `${serviceStatus.serviceName} Status: ${toMonthDayYearDateTime(serviceStatus.status.timestamp)}`,
            `  Status Indicator: ${foundStatus.status.indicator}`,
            `  Activity: ${foundStatus.status.description}`,
          ])).flat())
        ];

    }
    return result
  }
  metadata.label = () => `#${metadata.rank} ${metadata.companyName}`
  metadata.color = () => metadata.level === 'danger' ? 'red' : metadata.level === 'warning' ? 'yellow' : 'lightblue'
  metadata.href = (pageName: string) => metadata.pageInfo[pageName].href
  metadata.elementId = (pageName: string) => metadata.pageInfo.dashboard.elementId
  return metadata as CompanyMetadata

}
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
  let incidentRiskPercent = 0
  if (!isNaN(pastHourIncidentTotal) && !isNaN(pastDayIncidentTotal)) {
    const baseline15minAvg = Math.trunc(pastDayIncidentTotal/96)
    const pastHr15minAvg = Math.trunc(pastHourIncidentTotal/4)
    incidentRiskPercent = pastHr15minAvg / baseline15minAvg * 100
    incidentReports = {
      baseline15minAvg,
      pastHr15minAvg,
      incidentRiskPercent
    }
  } else {
    console.error(`${companyName} has empty dataset hour/day hour(${companyDiv.dataset.hour}) day(${companyDiv.dataset.day})`)
  }
  const pageInfo: CompanyPageInfo = {
    ['dashboard']: {
      href: 'https://downdetector.com/',
      elementId: companyDiv.id
    },
    ['status']: {
      href: statusAnchor.href,
    },
    ['map']: {
      href: `${statusAnchor.href}map/`,
    }
  }

  return toCompanyMetadataCard({
    timestamp,
    rank,
    level,
    companyName,
    incidentReports,
    pageInfo,
    incidentRisk: incidentRiskPercent,
    renderable: companyDiv
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
  const dashboard = persistence.loadDashboard<CompanyMetadata>(timestamp - StaleDuration);
  const result: Partial<CompanyStatusCard> = {
    renderable: statusElement,
  };
  if (dashboard) {
    result.allCompanies = dashboard.cards.map(toCompanyMetadataCard);
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

