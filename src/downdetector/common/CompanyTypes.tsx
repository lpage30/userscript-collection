import React, { JSX } from 'react'
import { Card, FilterableItems, ItemFilter } from '../../dashboardcomponents/datatypes';
import { ServiceStatus } from "../../statusAPIs/statustypes";
import { OutageBreakdown } from "../../geoblackout/outageBreakdownAPItypes";

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
export interface CompanyDivMetadata {
  id: string
  name: string
  href: string
  titleImage: {
    src: string
    height: number
    width: number
    class: string
  },
  sparkLineSvg: {
    height: number
    width: number
    class: string
    strokeWidth: number
    paths: {
      class: string
      d: string
      stroke?: string
      fill?: string
    }[]
  }
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
  dependentServiceStatuses?: ServiceStatus[]
  outageBreakdownService?: OutageBreakdown
  companyDiv: CompanyDivMetadata
}


export interface CompanyStatusCard {
  renderable: HTMLElement
  companyName: string;
  company?: CompanyMetadata;
  allCompanies?: CompanyMetadata[];
}

