import React, { useState, useEffect } from 'react';
import { PicklistItem } from './datatypes';
import { PersistenceClass } from './persistence';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import '../common/ui/styles.css';
import { toTitleCase } from '../common/functions';
import { awaitElementById } from '../common/await_functions';

interface PicklistProps {
  persistence: PersistenceClass;
  pageTypes: string[];
  usingPage: string;
  items: PicklistItem[];
  onFocusInDashboard?: (elementId: string) => Promise<void>;
  onMouseOver: (elementId: string) => void
  onMouseOut: (elementId: string) => void
}
const Picklist: React.FC<PicklistProps> = ({
  persistence,
  pageTypes,
  items,
  usingPage,
  onFocusInDashboard,
  onMouseOver,
  onMouseOut
}) => {
  const toItemIndex = (elementId: string | null, items: PicklistItem[]): number =>
    elementId === null ? -1 : items.findIndex(item => item.elementId(usingPage) === elementId)

  const toExistingElementId = (elementId: string | null, items: PicklistItem[]): string | null => {
    if (toItemIndex(elementId, items) < 0) return null
    return elementId
  }

  const [selectedElementId, setSelectedElementId] = useState(toExistingElementId(persistence.loadSelectedElementId(), items));

  useEffect(() => {
    const init = async () => {
      const initialElementId = toExistingElementId(persistence.loadSelectedElementId(), items);
      if (initialElementId && usingPage === 'dashboard') {
        await onFocusInDashboard(initialElementId);
      }
      setSelectedElementId(initialElementId);
    }
    init()
  }, []);
  useEffect(() => {
    const applyMouseOverandOutToItemTemplateParent = async () => {
      for(const item of items) {
        const optionElement = await awaitElementById(`${item.elementId(usingPage)}-option`)
        let parentElement = optionElement.parentElement
        while(parentElement && parentElement.tagName !== 'LI') { parentElement = parentElement.parentElement}
        if (parentElement === null) {
          parentElement = optionElement
        }
        parentElement.addEventListener('mouseover', () => onMouseOver(item.elementId(usingPage)))
        parentElement.addEventListener('mouseout', () => onMouseOut(item.elementId(usingPage)))
      }
    }
    applyMouseOverandOutToItemTemplateParent()
  })

  const openSelectedInPage = (page: string) => {
    const index = toItemIndex(selectedElementId, items)
    if (index < 0) return
    switch(page) {
      case 'dashboard':
        if (onFocusInDashboard) {
          onFocusInDashboard(selectedElementId)
          return
        }
      default:
        if (usingPage === page) {
          window.location.href = items[index].href(usingPage)
        } else {
          window.open(items[index].href(page))
        }
        break
    }
  }
  const onItemSelect = (elementId: string | null) => {
    const index = toItemIndex(elementId, items)
    if (index < 0) return
    persistence.storeSelectedElementId(elementId)
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
      item: PicklistItem
    }[] = items.map((item) => ({
      label: item.label(),
      value: item.elementId(usingPage),
      color: item.color(),
      item,
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
                onChange={(e) => onItemSelect(e.value)}
                highlightOnSelect={false}
                style={{ width: '100%' }}
                itemTemplate={(option) => (
                  <div
                    id={`${option.value}-option`}
                    className='item-picklist-option'
                    style={
                      {
                        '--border-color-left': `3px solid ${option.color}`,
                      } as React.CSSProperties
                    }
                  >
                    {option.label}
                  </div>
                )}
                placeholder='Pick Item for Dashboard / Status Focus'
              />
            </td>
          </tr><tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
            <td style={{display: 'flex'}}>
            {pageTypes.filter(page => page !== 'dashboard' || usingPage !== 'dashboard').map((name, index) => 
                <Button 
                  style={{marginLeft: 0 < index ? '3px' : '0px', marginTop: '3px'}}
                  className="app-button"
                  onClick={() => openSelectedInPage(name)}
                  disabled={toItemIndex(selectedElementId, items) < 0}
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
export default Picklist;
