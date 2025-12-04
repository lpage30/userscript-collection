// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_addValueChangeListener
// @grant       GM_removeValueChangeListener
import { ONE_MINUTE } from '../common/datetime';
import { ItemSort, ItemFilter, FilterableItems, Dashboard, Card } from './datatypes';
import { htmlStringToElement } from '../common/ui/reactTrustedHtmlString';

export const StaleDuration = 10 * ONE_MINUTE;

export class PersistenceClass {
  private selectedElementIdVariableName: string
  private sortVariableName: string
  private filterVariableName: string
  private dashboardVariableName: string
  private getInitialFilter: () => FilterableItems
  constructor(variableNamePrefix: string, getInitialFilter: () => FilterableItems) {
      this.selectedElementIdVariableName = `${variableNamePrefix}_selected_element_id`
      this.sortVariableName = `${variableNamePrefix}_sortings`
      this.filterVariableName = `${variableNamePrefix}_filters`
      this.dashboardVariableName = `${variableNamePrefix}_dashboard`
      this.getInitialFilter = getInitialFilter
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
  deleteSorting() {
    GM_deleteValue(this.sortVariableName);
  }

  storeFilter(filter: ItemFilter[]) {
    GM_setValue(this.filterVariableName, JSON.stringify(filter));
  }

  loadFilter(): ItemFilter[] {
    const result = GM_getValue(this.filterVariableName)
    return result ? JSON.parse(result) : Object.values(this.getInitialFilter());
  }
  deleteFilter() {
    GM_deleteValue(this.filterVariableName);
  }

  storeDashboard<T extends Card>(timestamp: number, cards: T[]) {
    GM_setValue(this.dashboardVariableName, JSON.stringify({
      timestamp,
      cards: cards.map((card: T) => ({...card, renderable: card.renderable.innerHTML } as any)),
    }));
  }
  private parseDashboard<T extends Card>(tooOldTimestamp: number, dashboardJSON: string | null): T[] | null {
    let dashboard = dashboardJSON as any
    if (dashboard) {
      dashboard = JSON.parse(dashboard) as Dashboard<T>
    }
    if (dashboard && dashboard.timestamp < tooOldTimestamp) {
      GM_deleteValue(this.dashboardVariableName);
      dashboard = null;
    }
    if (dashboard) {
      return dashboard.cards.map((card: any) => ({...card, renderable: htmlStringToElement(card.elementId, card.renderable)} as T))
    }
    return dashboard === null ? null : dashboard.cards;
  }

  loadDashboard<T extends Card>(tooOldTimestamp: number): T[] | null {
    return this.parseDashboard(tooOldTimestamp, GM_getValue(this.dashboardVariableName, null))
  }

  awaitDashboard<T extends Card>(): Promise<T[] | null> {
    return new Promise<T[] | null>(resolve => {
        const listenerId = GM_addValueChangeListener(
            this.dashboardVariableName,
            (name: string, oldValue: any, newValue: any, remote: boolean) => {
                GM_removeValueChangeListener(listenerId ?? "");
                resolve(this.parseDashboard(Date.now() - StaleDuration, newValue))
            }
        )
    })
  }

}
export const Persistence = (variablePrefix: string, getInitialFilter: () => FilterableItems = () => ({})) => new PersistenceClass(variablePrefix, getInitialFilter)