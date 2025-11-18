// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
import { ONE_MINUTE } from '../common/datetime';
import { ItemSort, ItemFilter, FilterableItems, Dashboard, Card } from './datatypes';

const StaleDuration = 10 * ONE_MINUTE;

export class PersistenceClass {
  private selectedElementIdVariableName: string
  private sortVariableName: string
  private filterVariableName: string
  private dashboardVariableName: string
  private initialFilter: FilterableItems
  constructor(variableNamePrefix: string, initialFilter: FilterableItems) {
      this.selectedElementIdVariableName = `${variableNamePrefix}_selected_element_id`
      this.sortVariableName = `${variableNamePrefix}_sortings`
      this.filterVariableName = `${variableNamePrefix}_filters`
      this.dashboardVariableName = `${variableNamePrefix}_dashboard`
      this.initialFilter = {...initialFilter}
  }
  storeSelectedElementId(elementId: string) {
    GM_setValue(this.selectedElementIdVariableName, JSON.stringify({
      timestamp: Date.now(),
      elementId,
    }));
  }
  loadSelectedElementId(): string | null {
      let selected = GM_getValue(this.selectedElementIdVariableName);
      if (selected) {
        selected = JSON.parse(selected)
      }
      if (selected && selected.timestamp < Date.now() - StaleDuration) {
          GM_deleteValue(this.selectedElementIdVariableName);
          selected = null;
      }
      return selected ? selected.elementId : null;
  }
  storeSorting(sortings: ItemSort[]) {
    GM_setValue(this.sortVariableName, JSON.stringify(sortings));
  }

  loadSorting(): ItemSort[] {
    const result = GM_getValue(this.sortVariableName)
    return result ? JSON.parse(result) : []
  }
  storeFilter(filter: ItemFilter[]) {
    GM_setValue(this.filterVariableName, JSON.stringify(filter));
  }

  loadFilter(): ItemFilter[] {
    const result = GM_getValue(this.filterVariableName)
    return result ? JSON.parse(result) : Object.values(this.initialFilter);
  }
  storeDashboard<T extends Card>(timestamp: number, cards: T[]) {
    GM_setValue(this.dashboardVariableName, JSON.stringify({
      timestamp,
      cards,
    }));
  }

  loadDashboard<T extends Card>(tooOldTimestamp: number): Dashboard<T> | null {
    let dashboard = GM_getValue(this.dashboardVariableName, null);
    if (dashboard) {
      dashboard = JSON.parse(dashboard) as Dashboard<T>
    }
    if (dashboard && dashboard.timestamp < tooOldTimestamp) {
      GM_deleteValue(this.dashboardVariableName);
      dashboard = null;
    }
    return dashboard;
}  
}
export const Persistence = (variablePrefix: string, initialFilter: FilterableItems = {}) => new PersistenceClass(variablePrefix, initialFilter)