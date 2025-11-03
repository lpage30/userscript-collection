import React, { useState, useRef, useEffect } from "react";
import "../../common/ui/styles.css";
import { Dialog } from "primereact/dialog";
import {
  CompanyStatusCard,
  CompanyMetadata,
  HealthLevelFilter,
  loadFilter,
  toHealthLevelCountMap,
  CompanySort,
  loadSorting,
  SortedFilteredCompanies,
  sortAndFilterCompanies,
  CompanyPageType,
  toCard
  
} from "../common/CompanyTypes";
import { awaitDelay } from "../../common/await_functions";
import CompanyPicklist from "../common/CompanyPickList";
import CompanyFilterSort from "../common/CompanyFilterSort";
import CompanyInfoDisplay from "../common/CompanyInfoDisplay";

interface CompanyStatusProps {
  company: CompanyStatusCard;
  page: CompanyPageType
}
const CompanyStatus: React.FC<CompanyStatusProps> = ({ company, page }) => {
  const triggerInfoDisplayRef = useRef<(company: CompanyMetadata | null ) => void>(null)
  const containerRef = useRef(null);
  const containerupdatedRef = useRef(false);
  const [sortedFilteredCompanies, setSortedFilteredCompanies] = useState<
    SortedFilteredCompanies<CompanyMetadata>
  >(
    sortAndFilterCompanies(company.allCompanies ?? [], {
      filter: loadFilter(),
      sorting: loadSorting(),
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
    filter: HealthLevelFilter,
    sorting: CompanySort[],
  ) => {
    setSortedFilteredCompanies(
      sortAndFilterCompanies(company.allCompanies ?? [], {filter, sorting}),
    );
  };
  const onMouseOverElement = (elementId: string) => {
    const company = toCard(elementId, sortedFilteredCompanies.filteredCompanies)
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
    const { sortedCompanies, filteredCompanies, sortingFilter } =
      sortedFilteredCompanies;
    return (
      <Dialog
        showHeader={true}
        position={"center"}
        modal
        visible={visible}
        onHide={() => setVisible(false)}
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
                <h2>DownDetector {page == 'status' ? 'Status' : 'Heatmap'}: {company.companyName}</h2>
              </td>
            </tr>
            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
              <td>
                <CompanyPicklist
                  usingPage={page}
                  companies={filteredCompanies}
                  onMouseOver={onMouseOverElement}
                  onMouseOut={onMouseOutElement}
                />
              </td><td style={{width: '200px'}}>
                <CompanyInfoDisplay registerDisplayTrigger={triggerInfoDisplay => { triggerInfoDisplayRef.current = triggerInfoDisplay}}/>
              </td><td>
                <CompanyFilterSort
                  initialFilterSort={sortingFilter}
                  healthLevelCountMap={toHealthLevelCountMap(sortedCompanies)}
                  onChange={handlFilterSorting}
                />
              </td>
            </tr>
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
