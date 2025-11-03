import React, { useState, useEffect, useRef } from 'react';
import '../../common/ui/styles.css';
import { Dialog } from 'primereact/dialog';
import CompanyCardShell from './CompanyCardShell';
import {
  CompanyCard,
  CompanyMetadata,
  HealthLevelFilter,
  CompanySort,
  loadSorting,
  loadFilter,
  toHealthLevelCountMap,
  SortedFilteredCompanies,
  sortAndFilterCompanies,
  CompanyPageType,
  toCardElementId,
  fromCardElementId,
  toCardIndex
} from '../common/CompanyTypes';
import { awaitElementById } from '../../common/await_functions';
import CompanyPicklist from '../common/CompanyPickList';
import CompanyInfoDisplay from '../common/CompanyInfoDisplay';
import CompanyFilterSort from '../common/CompanyFilterSort';

interface CompanyDashboardProps {
  companies: CompanyCard[];
  page: CompanyPageType
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ page, companies }) => {
  const triggerInfoDisplayRef = useRef<(company: CompanyMetadata | null ) => void>(null)
  const [visible, setVisible] = useState(true);
  const [sortedFilteredCompanies, setSortedFilteredCompanies] = useState<
    SortedFilteredCompanies<CompanyCard>
  >(
    sortAndFilterCompanies(companies, {
      filter: loadFilter(),
      sorting: loadSorting(),
    }),
  );
  const focusedElementIdRef = useRef<string>(null)

  const refreshCards = async () => {
    await awaitElementById(toCardElementId(sortedFilteredCompanies.sortedCompanies.length - 1))
    sortedFilteredCompanies.sortedCompanies.forEach((_company, index) => {
      const cardParent = document.getElementById(toCardElementId(index));
      if (cardParent.firstChild) {
        cardParent.removeChild(cardParent.firstChild)
      }
    });
    sortedFilteredCompanies.filteredCompanies.forEach((company, index) => {
      const cardParent = document.getElementById(toCardElementId(index));
      cardParent.appendChild(company.renderable)
    });
  };

  useEffect(() => {
    refreshCards();
  }, [sortedFilteredCompanies]);

  const handlFilterSorting = (
    filter: HealthLevelFilter,
    sorting: CompanySort[],
  ) => {
    setSortedFilteredCompanies(
      sortAndFilterCompanies(companies, {filter, sorting}),
    );
    focusedElementIdRef.current = null
  };

  const focusInDashboard = async (elementId: string) => {
    const index = toCardIndex(elementId, sortedFilteredCompanies.filteredCompanies)
    if (index == null) return
    const element = await awaitElementById(toCardElementId(index))

    if (element) {
      element.scrollIntoView();
      element.focus();
    }
  };

  const onFocus = (index: number) => {
    focusedElementIdRef.current = toCardElementId(index)
    onMouseOver(index)
  }
  const onMouseOver = (index: number) => {
    if(triggerInfoDisplayRef.current) {
      let company: CompanyMetadata | null = null
      if (index < sortedFilteredCompanies.filteredCompanies.length) {
        company = sortedFilteredCompanies.filteredCompanies[index]
      }
      triggerInfoDisplayRef.current(company)
    }
  }
  const onMouseOverElement = (elementId: string) => {
    const index = toCardIndex(elementId, sortedFilteredCompanies.filteredCompanies)
    if (index == null) return
    onMouseOver(index)
  }
  const onMouseOut = (index: number) => {
    if(triggerInfoDisplayRef.current) {
      if (focusedElementIdRef.current) {
        onMouseOver(fromCardElementId(focusedElementIdRef.current))
        return
      }
      triggerInfoDisplayRef.current(null)
    }
  }
  const onMouseOutElement = (elementId: string) => {
    const index = toCardIndex(elementId, sortedFilteredCompanies.filteredCompanies)
    if (index == null) return
    onMouseOut(index)
  }

  const getDivStyle = (index: number) => {
    const displayType = index < sortedFilteredCompanies.filteredCompanies.length ? 'block' : 'none';
    const result =
      focusedElementIdRef.current === toCardElementId(index)
        ? {
            backgroundColor: 'yellow',
            transition: 'background-color 0.5s ease-in-out',
            display: displayType,
          }
        : {
            display: displayType,
          };
    return result;
  };


  const render = () => {
    return (
      <Dialog
        showHeader={true}
        closable={false}
        position={'center'}
        modal
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: '90vw', height: '90vh' }}
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
                <h2>DownDetector Dashboard's Top {sortedFilteredCompanies.sortedCompanies.length}</h2>
              </td>
            </tr>
            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
              <td>
                <CompanyPicklist
                  usingPage={page}
                  companies={sortedFilteredCompanies.filteredCompanies}
                  onFocusInDashboard={focusInDashboard}
                  onMouseOver={onMouseOverElement}
                  onMouseOut={onMouseOutElement}
                />
              </td><td style={{width: '200px'}}>
                <CompanyInfoDisplay registerDisplayTrigger={triggerInfoDisplay => { triggerInfoDisplayRef.current = triggerInfoDisplay}}/>
              </td><td>
                <CompanyFilterSort
                  initialFilterSort={sortedFilteredCompanies.sortingFilter}
                  healthLevelCountMap={toHealthLevelCountMap(sortedFilteredCompanies.sortedCompanies)}
                  onChange={handlFilterSorting}
                />
              </td>
            </tr>
          </tbody></table>          
        }
        className='p-dialog-maximized'
      >
        <div
          id='card-container'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          {sortedFilteredCompanies.sortedCompanies.map((_item, index) => (
            <CompanyCardShell
              id={toCardElementId(index)}
              index={index}
              onFocus={onFocus}
              getStyle={getDivStyle}
              onMouseOver={onMouseOver}
              onMouseOut={onMouseOut}
            />
          ))}
        </div>
      </Dialog>
    );
  };
  return render();
};

export default CompanyDashboard;
