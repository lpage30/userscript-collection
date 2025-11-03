import React, { useState, useEffect } from 'react';
import {
  CompanyMetadata,
  loadSelectedElementId,
  storeSelectedElementId,
  toHealthLevelColor,
  CompanyPageType,
  CompanyPageTypes
} from './CompanyTypes';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import '../../common/ui/styles.css';
import { toTitleCase } from '../../common/functions';
import { awaitElementById } from '../../common/await_functions';

interface CompanyPicklistProps {
  usingPage: CompanyPageType;
  companies: CompanyMetadata[];
  onFocusInDashboard?: (elementId: string) => Promise<void>;
  onMouseOver: (elementId: string) => void
  onMouseOut: (elementId: string) => void
}

const toCompanyIndex = (elementId: string | null, companies: CompanyMetadata[]): number =>
  elementId === null ? -1 : companies.findIndex(company => company.pageInfo.dashboard.elementId === elementId)

const toExistingElementId = (elementId: string | null, companies: CompanyMetadata[]): string | null => {
  if (toCompanyIndex(elementId, companies) < 0) return null
  return elementId
}

const CompanyPicklist: React.FC<CompanyPicklistProps> = ({
  companies,
  usingPage,
  onFocusInDashboard,
  onMouseOver,
  onMouseOut
}) => {
  const [selectedElementId, setSelectedElementId] = useState(toExistingElementId(loadSelectedElementId(), companies));

  useEffect(() => {
    const init = async () => {
      const initialElementId = toExistingElementId(loadSelectedElementId(), companies);
      if (initialElementId && usingPage === 'dashboard') {
        await onFocusInDashboard(initialElementId);
      }
      setSelectedElementId(initialElementId);
    }
    init()
  }, []);
  useEffect(() => {
    const applyMouseOverandOutToItemTemplateParent = async () => {
      for(const company of companies) {
        const optionElement = await awaitElementById(`${company.pageInfo.dashboard.elementId}-option`)
        let parentElement = optionElement.parentElement
        while(parentElement && parentElement.tagName !== 'LI') { parentElement = parentElement.parentElement}
        if (parentElement === null) {
          parentElement = optionElement
        }
        parentElement.addEventListener('mouseover', () => onMouseOver(company.pageInfo.dashboard.elementId))
        parentElement.addEventListener('mouseout', () => onMouseOut(company.pageInfo.dashboard.elementId))
      }
    }
    applyMouseOverandOutToItemTemplateParent()
  })

  const openSelectedInPage = (page: CompanyPageType) => {
    const index = toCompanyIndex(selectedElementId, companies)
    if (index < 0) return
    switch(page) {
      case 'dashboard':
        if (onFocusInDashboard) {
          onFocusInDashboard(selectedElementId)
          return
        }
      default:
        if (usingPage === page) {
          window.location.href = companies[index].pageInfo[usingPage].href
        } else {
          window.open(companies[index].pageInfo[page].href)
        }
        break
    }
  }
  const onCompanySelect = (elementId: string | null) => {
    const index = toCompanyIndex(elementId, companies)
    if (index < 0) return
    storeSelectedElementId(elementId)
    setSelectedElementId(elementId)
    if (onFocusInDashboard) {
      onFocusInDashboard(elementId)
    }
  }
  function render() {
    const picklistLabelValue: {
      label: string;
      value: string;
      color: string;
      company: CompanyMetadata
    }[] = companies.map((company) => ({
      label: `#${company.rank} ${company.companyName}`,
      value: company.pageInfo.dashboard.elementId,
      color: toHealthLevelColor(company.level),
      company,
    }));
    return (
      <table
        style={{
          tableLayout: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '0',
          marginBottom: 'auto',
          width: '100%',
        }}
      >
        <tbody>
          <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
            <td className='text-center'>
              <Dropdown
                options={picklistLabelValue}
                optionLabel={'label'}
                optionValue={'value'}
                value={selectedElementId}
                onChange={(e) => onCompanySelect(e.value)}
                highlightOnSelect={false}
                style={{ width: '100%' }}
                itemTemplate={(option) => (
                  <div
                    id={`${option.value}-option`}
                    className='company-picklist-option'
                    style={
                      {
                        '--border-color-left': `3px solid ${option.color}`,
                      } as React.CSSProperties
                    }
                  >
                    {option.label}
                  </div>
                )}
                placeholder='Pick Company for Dashboard / Status Focus'
              />
            </td>
          </tr><tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
            <td style={{display: 'flex'}}>
            {CompanyPageTypes.filter(page => page !== 'dashboard' || usingPage !== 'dashboard').map((name, index) => 
                <Button 
                  style={{marginLeft: 0 < index ? '3px' : '0px', marginTop: '3px'}}
                  className="app-button"
                  onClick={() => openSelectedInPage(name)}
                  disabled={toCompanyIndex(selectedElementId, companies) < 0}
                >Open for {toTitleCase(name)}</Button>
            )}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
  return render();
};
export default CompanyPicklist;
