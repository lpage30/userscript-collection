import React, { JSX } from 'react'
import { CompanyHealthStatus, HealthLevelType } from '../../common/CompanyHealthStatus';
import { Card, FilterableItems, ItemFilter } from '../../dashboardcomponents/datatypes';

export const CompanyPageTypes = ['dashboard', 'status', 'map'] as const;
export type CompanyPageType = (typeof CompanyPageTypes)[number];

export const sortingFields = ['level', 'groupName', 'riskFactor'];
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
  riskFactorFactor: number
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
export interface CompanyMetadata extends CompanyHealthStatus, Card {
  timestamp: number;
  rank: number;
  incidentReports?: IncidentReports;
  pageInfo: CompanyPageInfo
  displayLinesArray: string[]
  companyDiv: CompanyDivMetadata
}


export interface CompanyStatusCard {
  renderable: HTMLElement
  companyName: string;
  company?: CompanyMetadata;
  allCompanies?: CompanyMetadata[];
}

