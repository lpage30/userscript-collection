import React, { JSX } from 'react'
import { HealthLevelType, CompanyHealthLevelTypeInfoMap } from '../../common/CompanyHealthStatus'
import { toCardIndex } from '../../dashboardcomponents/datatypes'
import { CompanyDivMetadata, CompanyMetadata, IncidentReports, CompanyPageInfo, CompanyPageType, CompanyStatusCard } from './CompanyTypes'
import { PersistenceClass, StaleDuration } from '../../dashboardcomponents/persistence';
import { toTitleCase } from '../../common/functions';


export const toCard = (elementId: string, pageName: string, companies: CompanyMetadata[] | undefined): CompanyMetadata | null => {
    const index = toCardIndex(elementId, companies)
    return index === null ? companies[index] : null
}
function toCompanyDivMetadata(companyDiv: HTMLElement): CompanyDivMetadata {
    const svg = companyDiv.querySelector('svg');
    const anchor = companyDiv.querySelector('a')!;
    const img = companyDiv.querySelector('img')
    const h5 = companyDiv.querySelector('h5')
    return {
        id: companyDiv.id,
        name: h5.innerText,
        href: anchor.href,
        titleImage: {
            src: img.dataset.original,
            height: img.height,
            width: img.width,
            class: img.className
        },
        sparkLineSvg: {
            height: parseFloat(svg.attributes['height'].value),
            width: parseFloat(svg.attributes['width'].value),
            class: svg.attributes['class'].value,
            strokeWidth: parseFloat(svg.attributes['stroke-width'].value),
            paths: Array.from(svg.querySelectorAll('path')).map(path => ({
                class: path.attributes['class'].value,
                d: path.attributes['d'].value,
                stroke: path.attributes['stroke'] ? path.attributes['stroke'].value : undefined,
                fill: path.attributes['fill'] ? path.attributes['fill'].value : undefined,
            }))
        }
    }
}
function toCompanyMetadataCard(data: Partial<CompanyMetadata>): CompanyMetadata {
    const metadata: Partial<CompanyMetadata> = { ...data }
    metadata.timestamp = data.timestamp ?? Date.now()
    metadata.rank = data.rank ?? 0
    metadata.level = data.level ?? 'success'
    metadata.companyName = data.companyName ?? ''
    metadata.pageInfo = {
        ...(data.pageInfo ?? {
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
        })
    }
    metadata.incidentRisk = data.incidentRisk ?? 0
    metadata.displayLinesArray = [...(data.displayLinesArray ?? [])]

    metadata.displayLines = () => metadata.displayLinesArray
    metadata.groupName = metadata.companyName
    metadata.label = () => `#${metadata.rank} ${metadata.companyName}`
    metadata.color = () => CompanyHealthLevelTypeInfoMap[metadata.level].bgColor
    metadata.href = (pageName: string) => metadata.pageInfo[pageName].href
    metadata.companyDiv = { ...data.companyDiv }
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

export function toCompanyInfo(
    timestamp: number,
    rank: number,
    companyDiv: HTMLElement,
): CompanyMetadata {
    const divMetadata = toCompanyDivMetadata(companyDiv)
    const svg = companyDiv.querySelector('svg');

    const elementId = `${divMetadata.id}-card`
    const level = svg.classList[0] as HealthLevelType;
    const companyName = divMetadata.name;
    const pastHourIncidentTotal = parseInt(companyDiv.dataset.hour)
    const pastDayIncidentTotal = parseInt(companyDiv.dataset.day)
    let incidentReports: IncidentReports | undefined = undefined
    let incidentRiskFactor = 0
    if (!isNaN(pastHourIncidentTotal) && !isNaN(pastDayIncidentTotal)) {
        const baseline15minAvg = Math.trunc(pastDayIncidentTotal / 96)
        const pastHr15minAvg = Math.trunc(pastHourIncidentTotal / 4)
        incidentRiskFactor = Math.floor(Math.abs(pastHr15minAvg - baseline15minAvg) / baseline15minAvg)
        incidentReports = {
            baseline15minAvg,
            pastHr15minAvg,
            incidentRiskFactor
        }
    } else {
        console.error(`${companyName} has empty dataset hour/day hour(${companyDiv.dataset.hour}) day(${companyDiv.dataset.day})`)
    }
    const pageInfo: CompanyPageInfo = {
        ['dashboard']: {
            href: 'https://downdetector.com/',
            elementId
        },
        ['status']: {
            href: divMetadata.href,
        },
        ['map']: {
            href: `${divMetadata.href}map/`,
        }
    }
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
        elementId,
        companyDiv: divMetadata,
    }
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