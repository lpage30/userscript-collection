import { IndicatorType, ServiceStatus } from "../statustypes"

export const IndicatorTypeInfoMap = {
  major: { rank: 1, bgColor: 'red', fgColor: 'white', displayName: 'Major Impact' },
  minor: { rank: 2, bgColor: 'orange', fgColor: 'black', displayName: 'Minor Impact' },
  other: { rank: 3, bgColor: 'purple', fgColor: 'white', displayName: 'Possible Impact' },
  healthy: { rank: 4, bgColor: 'green', fgColor: 'white', displayName: 'No Impact' },
}
export function toIndicatorTypeInfo(indicator: IndicatorType) {
    let result = IndicatorTypeInfoMap[indicator]
    if (result !== undefined) return indicator
    switch(indicator) {
      case 'Operational':
      case 'All Systems Operational':
      case 'none':
        return 'healthy'
      default:
        return 'other'
    }
}

export const CompanyHealthLevelTypeInfoMap = {
    danger: { rank: 1, bgColor: 'red', fgColor: 'white', displayName: 'Major Impact'},
    warning:{ rank: 2, bgColor: 'orange', fgColor: 'black', displayName: 'Minor Impact'},
    success:{ rank: 3, bgColor: 'green', fgColor: 'white', displayName: 'No Impact'}
}

export function sortServiceByIndicatorRank(l: ServiceStatus, r: ServiceStatus) {
  try {
    return IndicatorTypeInfoMap[toIndicatorTypeInfo(l.status.indicator)].rank - IndicatorTypeInfoMap[toIndicatorTypeInfo(r.status.indicator)].rank
  } catch(e) {
    console.error('bad data', e)
    throw e
  }
}
export function sortIndicatorByIndicatorRank(l: string, r: string) {
  return IndicatorTypeInfoMap[l].rank - IndicatorTypeInfoMap[r].rank
}