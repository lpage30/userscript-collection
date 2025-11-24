const healthyStatuses = [
    'no recent issues', 
    'no Reported Event', 
    'noevent',
    'none',
    'available status',
    'not available',
    'good',
    'active locations',
]
export const NoStatusStatus = 'healthy'
export const getMaxOccurringValidStatus = (statuses: string[]) => {
  const statusOccurrence = statuses
    .filter(status => !healthyStatuses.includes(status.toLowerCase()))
    .reduce((statusOccurrenceMap, status) => ({
      ...statusOccurrenceMap,
      [status]: (statusOccurrenceMap[status] ?? 0) + 1,
  }), {} as { [status: string]: number})

  return Object.entries(statusOccurrence).reduce((NameMax, [name, count]) => {
    return count > NameMax.max ? { name, max: count} : NameMax
  }, { name: NoStatusStatus, max: 0 }).name
}