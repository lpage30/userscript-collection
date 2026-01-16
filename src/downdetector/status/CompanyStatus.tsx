import React, { useState, useRef, useEffect } from "react";
import "../../common/ui/styles.scss";
import { Dialog } from "primereact/dialog";
import {
  CompanyStatusCard,
  CompanyMetadata,
  CompanyPageType,
  toCard
} from "../common/CompanyTypes";
import { awaitDelay } from "../../common/await_functions";
import { SortedFilteredItems, sortAndFilterItems, ItemFilter, ItemSort, FilterableItems } from "../../dashboardcomponents/datatypes";
import { PersistenceClass } from "../../dashboardcomponents/persistence";
import { CompanyTitle } from "../common/CompanyTitle";
import Picklist from "../../dashboardcomponents/PickList";
import FilterSort from "../../dashboardcomponents/FilterSort";
import InfoDisplay from "../../dashboardcomponents/InfoDisplay";
import { createOnExternalDataUpdates } from "../common/onexternaldataupdate";
import { ServiceDashboardPopupAndSummary } from "../../statusAPIs/ui/ServiceDashboard";
import { LoadOutageBreakdowns } from "../../geoblackout/ui/LoadOutageBreakdowns";

interface CompanyStatusProps {
  persistence: PersistenceClass
  pageTypes: string[]
  filterableItems: FilterableItems
  sortingFields: string[]
  company: CompanyStatusCard;
  page: CompanyPageType
}
const CompanyStatus: React.FC<CompanyStatusProps> = ({
  persistence,
  pageTypes,
  filterableItems,
  sortingFields,
  company,
  page
}) => {
  const triggerInfoDisplayRef = useRef<(data: CompanyMetadata | null) => void>(null)
  const containerRef = useRef(null);
  const containerupdatedRef = useRef(false);
  const [sortedFilteredItems, setSortedFilteredItems] = useState<
    SortedFilteredItems<CompanyMetadata>
  >(
    sortAndFilterItems(company.allCompanies ?? [], filterableItems, {
      filter: persistence.loadFilter(),
      sorting: persistence.loadSorting(),
    }),
  );
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    awaitDelay(500).then(() => {
      if (containerRef.current && !containerupdatedRef.current) {
        containerupdatedRef.current = true;
        if (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild)
        }
        containerRef.current.appendChild(company.renderable);
        if (company.company && triggerInfoDisplayRef.current) {
          triggerInfoDisplayRef.current(company.company)
        }
      }
    });
  });
  const handlFilterSorting = (
    filter: ItemFilter[],
    sorting: ItemSort[],
  ) => {
    setSortedFilteredItems(
      sortAndFilterItems(company.allCompanies ?? [], filterableItems, { filter, sorting }),
    );
  };

  const onMouseOverElement = (elementId: string) => {
    const company = toCard(elementId, page, sortedFilteredItems.filteredItems)
    if (company && triggerInfoDisplayRef.current) {
      triggerInfoDisplayRef.current(company)
    }
  }
  const onMouseOutElement = (elementId: string) => {
    if (company.company && triggerInfoDisplayRef.current) {
      triggerInfoDisplayRef.current(company.company)
    }

  }
  const render = () => {
    const { sortedItems, filteredItems, sortingFilter } =
      sortedFilteredItems;
    const { onServiceStatus, onOutageBreakdowns } = createOnExternalDataUpdates([company.company, ...filteredItems], persistence)
    return (
      <Dialog
        appendTo={'self'}
        showHeader={true}
        position={"center"}
        modal
        visible={visible}
        onHide={() => setVisible(false)}
        closable={true}
        showCloseIcon={true}
        style={{ width: "90vw", height: "90vh" }}
        header={
          <table
            style={{
              tableLayout: 'auto',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginTop: '0',
              marginBottom: 'auto',
              width: '100%',
            }}
          ><tbody>
              <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                <td colSpan={3} className="text-center">
                  <CompanyTitle 
                    titleType={'page'}
                    company={company.company}
                    prefix={`DownDetector ${page == 'status' ? 'Status' : 'Heatmap'}:`}
                  />
                </td>
              </tr>
              <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                <td>
                  <Picklist
                    persistence={persistence}
                    pageTypes={pageTypes}
                    usingPage={page}
                    items={filteredItems}
                    onMouseOver={onMouseOverElement}
                    onMouseOut={onMouseOutElement}
                  />
                </td><td style={{ width: '200px' }} rowSpan={2}>
                  <InfoDisplay
                    registerDisplayTrigger={triggerInfoDisplay => { triggerInfoDisplayRef.current = triggerInfoDisplay }}
                    textPaddingLeft={{ value: 0.5, type: 'rem'}}
                  />
                </td><td>
                  <FilterSort
                    persistence={persistence}
                    getFilterableItems={() => filterableItems}
                    sortingFields={sortingFields}
                    initialFilterSort={sortedFilteredItems.sortingFilter}
                    onChange={handlFilterSorting}
                  />
                </td>
              </tr>
              <tr><td colSpan={2}>
                <LoadOutageBreakdowns
                  onOutageBreakdowns={(outages) => {
                    onOutageBreakdowns(outages)
                    const foundCompany = filteredItems.find(({ companyName }) => companyName === company.company?.companyName)
                    company.company = foundCompany ?? company.company
                    triggerInfoDisplayRef.current(company.company)
                  }}
                />
              </td></tr>
              <tr><td colSpan={2}>
                <ServiceDashboardPopupAndSummary
                  onServiceStatus={onServiceStatus}
                  companyHealthStatuses={filteredItems.map(({ companyName, level }) => ({ companyName, healthStatus: level }))}
                  isolatedCompanyNames={[company.companyName]}
                />
              </td></tr>
            </tbody></table>
        }
        className="p-dialog-maximized"
      >
        <div id="company-status" ref={containerRef} onClick={(e) => {
          if (e.currentTarget.firstElementChild) {
            if (company.company) {
              window.location.href = company.company.pageInfo[page === 'status' ? 'map' : 'status'].href
            }
          }
        }}></div>
      </Dialog>
    );
  };
  return render();
};

export default CompanyStatus;
