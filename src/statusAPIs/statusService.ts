import { ServiceStatus, Status, Incident } from "./statustypes"

export enum StatusLevel {
    Operational = 0x0000,
    Maintenance = 0x0001,
    PartialOutage = 0x0002,
    MinorOutage = 0x0004,
    MajorOutage = 0x0008,
}
export interface StatusMetadata {
    level: StatusLevel
    rank: number
    bgColor: string
    fgColor: string
    impactName: string
    statusName: string
}
const statusMetadataMap: { [status: number]: StatusMetadata } = Object.freeze({
    [StatusLevel.MajorOutage]: {
        level: StatusLevel.MajorOutage,
        rank: 1,
        bgColor: 'red',
        fgColor: 'white',
        impactName: 'Major Impact',
        statusName: 'Major Outage',
    },
    [StatusLevel.MinorOutage]: {
        level: StatusLevel.MinorOutage,
        rank: 2,
        bgColor: 'orange',
        fgColor: 'black',
        impactName: 'Minor Impact',
        statusName: 'Minor Outage',
    },
    [StatusLevel.PartialOutage]: {
        level: StatusLevel.PartialOutage,
        rank: 3,
        bgColor: 'yellow',
        fgColor: 'black',
        impactName: 'Partial Impact',
        statusName: 'Partial Outage',
    },
    [StatusLevel.Maintenance]: {
        level: StatusLevel.Maintenance,
        rank: 4,
        bgColor: 'purple',
        fgColor: 'white',
        impactName: 'Possible Impact',
        statusName: 'Maintenance',
    },
    [StatusLevel.Operational]: {
        level: StatusLevel.Operational,
        rank: 5,
        bgColor: 'green',
        fgColor: 'white',
        impactName: 'No Impact',
        statusName: 'Healthy',
    },
})

const statusArray: { level: StatusLevel, words: string[] }[] = [
    {
        level: StatusLevel.MajorOutage,
        words: [
            'major',
            'critical',
        ]
    },
    {
        level: StatusLevel.MinorOutage,
        words: [
            'minor',
            'progress',
            'monitoring',
            'active',
        ]
    },
    {
        level: StatusLevel.PartialOutage,
        words: [
            'partial',
            'degraded',
        ]
    },
    {
        level: StatusLevel.Maintenance,
        words: [
            'maintenance',
            'scheduled',
        ]
    },
    {
        level: StatusLevel.Operational,
        words: [
            'no recent issues',
            'no reported event',
            'noevent',
            'none',
            'available',
            'available status',
            'not available',
            'good',
            'active locations',
            'operational',
            'ok',
            'healthy',
            'informational',
        ]
    }
]
export function getSortedStatusLevels(): StatusLevel[] {
    return Object.values(statusMetadataMap).sort((l: StatusMetadata, r: StatusMetadata) =>
        l.rank - r.rank
    ).map(v => v.level)
}
export function getStatusMetadata(status: StatusLevel): StatusMetadata {
    return statusMetadataMap[status]
}
export function classifyStatus(text: string): StatusLevel | undefined {
    const lcText = (text ?? '').toLowerCase()
    const result = statusArray.find(({ words }) => undefined !== words.find(word => lcText.includes(word)))
    return result ? result.level : undefined
}
export interface ComparableTextServiceStatus {
    text?: string
    status?: StatusLevel
}
function compareTextFunction(l?: string, r?: string): number {
    if (l && r) {
        return l.localeCompare(r)
    }
    return l ? -1 : r ? 1 : 0
}
export function compareFunction(l: ComparableTextServiceStatus, r: ComparableTextServiceStatus, compareTextonNoStatus: boolean = true): number {
    if (l.status && r.status) {
        if (l.status === r.status) {
            return compareTextFunction(l.text, r.text)
        }
        return getStatusMetadata(l.status).rank - getStatusMetadata(r.status).rank
    }
    return l.status ? -1 : r.status ? 1 : compareTextonNoStatus ? compareTextFunction(l.text, r.text) : 0
}
export function sortServiceByStatusIndicatorRank(l: ServiceStatus, r: ServiceStatus) {
    return compareFunction({ text: l.status.indicator, status: l.status.statusLevel }, { text: r.status.indicator, status: r.status.statusLevel })
}
export function determineOverallStatusLevel(status: Status, incidents: Incident[]): StatusLevel {
    const statusLevelCountMap = incidents.reduce((levelCounts, incident) => {
        const result = incident.updates.reduce((updateLevelCounts, update) => {
            if (undefined !== update.statusLevel) {
                if (undefined === updateLevelCounts[update.statusLevel]) {
                    updateLevelCounts[update.statusLevel] = 0
                }
                updateLevelCounts[update.statusLevel] = updateLevelCounts[update.statusLevel] + 1
            }
            return updateLevelCounts
        }, { ...levelCounts })
        if (undefined !== incident.statusLevel) {
            if (undefined === result[incident.statusLevel]) {
                result[incident.statusLevel] = 0
            }
            result[incident.statusLevel] = result[incident.statusLevel] + 1
        }
        return result
    }, {} as { [level: number]: number })
    const maxNonOperationalLevel = Object.values(StatusLevel)
        .filter((level: number) => StatusLevel.Operational !== level && undefined !== statusLevelCountMap[level])
        .map((level: number) => ([level, statusLevelCountMap[level]]))
        .reduce((maxEntry, entry) => {
            if (maxEntry[1] < entry[1]) {
                return entry
            }
            return maxEntry
        }, [-1, 0])[0] as number
    if (maxNonOperationalLevel < 0 && undefined === statusLevelCountMap[StatusLevel.Operational]) {
        return classifyStatus(status.indicator) ?? StatusLevel.Operational
    }
    return 0 <= maxNonOperationalLevel ? maxNonOperationalLevel as StatusLevel : StatusLevel.Operational
}