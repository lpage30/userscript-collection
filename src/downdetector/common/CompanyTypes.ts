// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
import { toTitleCase } from '../../common/functions';
import { ONE_MINUTE, toMonthDayYearDateTime } from '../../common/datetime';

const CompanyMetadataVariableName = 'downdetected_companies';
const SelectedCompanyElementId = 'selected_company_element_id';
const FilterVariableName = 'filters';
const SortVariableName = 'sortings';
const StaleDuration = 10 * ONE_MINUTE;

export const HealthLevelTypes = ['danger', 'warning', 'success'] as const;
export type HealthLevelType = (typeof HealthLevelTypes)[number];
export type HealthLevelCountMap = { [level in HealthLevelType]: number };
export type HealthLevelFilter = { [level in HealthLevelType]: boolean };

export const CompanySortTypes = ['level', 'name' ] as const;
export type CompanySortType = (typeof CompanySortTypes)[number];
export const CompanyPageTypes = ['dashboard', 'status', 'map'] as const;
export type CompanyPageType = (typeof CompanyPageTypes)[number];

export interface CompanySort {
  sortType: CompanySortType;
  ascending: boolean;
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
export interface CompanyMetadata {
  timestamp: number;
  rank: number;
  level: HealthLevelType;
  companyName: string;
  tooltipLines: string[];
  dataTime: { hour: number, day: number};
  pageInfo: CompanyPageInfo
}
export const toCardElementId = (index: number) => `company-card-shell-${index}`
export const fromCardElementId = (elementId: string): number => parseInt(elementId.split('-').slice(-1)[0])
export const toCardIndex = (elementId: string, companies: CompanyMetadata[] | undefined): number | null => {
    const index = (companies ?? []).findIndex(
      (item) => item.pageInfo.dashboard.elementId === elementId,
    );
    return index < 0 ? null : index
}
export const toCard = (elementId: string, companies: CompanyMetadata[] | undefined): CompanyMetadata | null => {
  const index = toCardIndex(elementId, companies)
  return index === null ? companies[index] : null
}
  
export interface CompanyCard extends CompanyMetadata {
  renderable: HTMLElement;
}
export interface Dashboard {
  timestamp: number;
  companies: CompanyMetadata[];
}

export interface CompanyStatusCard {
  renderable: HTMLElement;
  companyName: string;
  company?: CompanyMetadata;
  allCompanies?: CompanyMetadata[];
}

export interface SortingFilter {
  filter: HealthLevelFilter;
  sorting: CompanySort[];
}

export interface SortedFilteredCompanies<T extends CompanyMetadata> {
  sortingFilter: SortingFilter;
  sortedCompanies: T[];
  filteredCompanies: T[];
}



const toHealthPriority = (level: HealthLevelType) => {
  switch (level) {
    case 'danger':
      return 1;
    case 'warning':
      return 2;
    default:
      return 3;
  }
};

function toCompanyInfo(
  timestamp: number,
  rank: number,
  companyDiv: HTMLElement,
): { card: CompanyCard; metadata: CompanyMetadata } {
  const svg = companyDiv.querySelector('svg');
  const statusAnchor = companyDiv.querySelector('a')!;

  const level = svg.classList[0] as HealthLevelType;
  const companyName = statusAnchor.innerText.trim();
  const dataTime = {
    hour: parseInt(companyDiv.dataset.hour),
    day: parseInt(companyDiv.dataset.day)
  }
  const tooltipLines = [
    `${companyName}`,
    `${toMonthDayYearDateTime(timestamp)}`,
    `HealthLevel: ${level}`,
    `Rank: ${rank}`,
  ];
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

  const metadata = {
    timestamp,
    rank,
    level,
    companyName,
    tooltipLines,
    dataTime,
    pageInfo,
  };
  const card = {
    ...metadata,
    renderable: companyDiv,
  };
  return { card, metadata };
}

function storeDashboard(timestamp: number, companies: CompanyMetadata[]) {
  GM_setValue(CompanyMetadataVariableName, {
    timestamp,
    companies,
  });
}

function loadDashboard(tooOldTimestamp: number): Dashboard | null {
  let dashboard: Dashboard | null = GM_getValue(
    CompanyMetadataVariableName,
    null,
  );
  if (dashboard && dashboard.timestamp < tooOldTimestamp) {
    GM_deleteValue(CompanyMetadataVariableName);
    dashboard = null;
  }
  return dashboard;
}

function toSortFunction<T extends CompanyMetadata>(sorts: CompanySort[],): (l: T, r: T) => number {
  return (l: T, r: T): number => {
    let result = 0
    for (const sort of sorts) {
      if (0 !== result) return result
      switch (sort.sortType) {
        case 'level':
          result = sort.ascending ? toHealthPriority(l.level) - toHealthPriority(r.level) : toHealthPriority(r.level) - toHealthPriority(l.level);
          break;
        case 'name':
          result = sort.ascending ? l.companyName.localeCompare(r.companyName) : r.companyName.localeCompare(l.companyName);
          break;
        default:
          break;
      }
    }
    return result
  }
}
export const toHealthLevelColor = (level: HealthLevelType) => {
  switch (toHealthPriority(level)) {
    case 1:
      return 'red';
    case 2:
      return 'yellow';
    default:
      return 'lightblue';
  }
};

export const initialHealthLevelCountMap = Object.freeze(
  HealthLevelTypes.reduce(
    (initialMap, level) => ({
      ...initialMap,
      [level as HealthLevelType]: 0,
    }),
    {},
  ) as HealthLevelCountMap,
);


export const initialHealthLevelFilter = Object.freeze(
  HealthLevelTypes.reduce(
    (initialMap, level) => ({
      ...initialMap,
      [level as HealthLevelType]: true,
    }),
    {},
  ) as HealthLevelFilter,
);

export function storeSelectedElementId(elementId: string) {
  GM_setValue(SelectedCompanyElementId, {
    timestamp: Date.now(),
    elementId,
  });
}

export function storeFilter(filter: HealthLevelFilter) {
  GM_setValue(FilterVariableName, filter);
}

export function loadFilter(): HealthLevelFilter {
  return GM_getValue(FilterVariableName, initialHealthLevelFilter);
}

export function storeSorting(sortings: CompanySort[]) {
  GM_setValue(SortVariableName, sortings);
}

export function loadSorting(): CompanySort[] {
  return GM_getValue(SortVariableName, []);
}

export function loadSelectedElementId(): string | null {
  let selected = GM_getValue(SelectedCompanyElementId);
  if (selected && selected.timestamp < Date.now() - StaleDuration) {
    GM_deleteValue(SelectedCompanyElementId);
    selected = null;
  }
  return selected ? selected.elementId : null;
}
export const dashboardCardsQueryAllSelector = 'div[class*="company-index"]'
export function processCompanyDashboardCards(
  cardElements: HTMLElement[],
): CompanyCard[] {
  const timestamp = Date.now();
  const result = cardElements.map((element, index) =>
    toCompanyInfo(timestamp, index + 1, element),
  );
  storeDashboard(
    timestamp,
    result.map(({ metadata }) => metadata),
  );
  return result.map(({ card }) => card);
}

export const statusElementId = 'chart-row'
export const statusMapElementId = 'map_container'
export function processCompanyStatus(
  pageType: CompanyPageType,
  statusElement: HTMLElement,
  statusHref: string,
): CompanyStatusCard {
  const timestamp = Date.now();
  const dashboard = loadDashboard(timestamp - StaleDuration);
  const result: Partial<CompanyStatusCard> = {
    renderable: statusElement,
  };
  if (dashboard) {
    result.allCompanies = dashboard.companies;
    const foundCompany = dashboard.companies.find(
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

export function toHealthLevelCountMap(
  companies: CompanyMetadata[],
): HealthLevelCountMap {
  const result = { ...initialHealthLevelCountMap };
  companies.forEach(({ level }) => {
    result[level]++;
  });
  return result;
}

export function sortAndFilterCompanies<T extends CompanyMetadata>(
  companies: T[],
  sortingFilter: SortingFilter,
): SortedFilteredCompanies<T> {
  const sortFunction = toSortFunction<T>(sortingFilter.sorting)
  const sortedCompanies: T[] = [...companies].sort(sortFunction)
  const filteredCompanies: T[] = sortedCompanies.filter(
    ({ level }) => sortingFilter.filter[level],
  );
  return {
    sortingFilter,
    sortedCompanies,
    filteredCompanies,
  };
}