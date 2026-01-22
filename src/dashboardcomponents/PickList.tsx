import React, { useState, useEffect } from 'react';
import { PicklistItem, toCardElementId } from './datatypes';
import { PersistenceClass } from './persistence';
import { Button } from 'primereact/button';
import { PickList, PickOption } from '../common/ui/picklist'
import '../common/ui/styles.scss';
import { toTitleCase } from '../common/functions';
import { awaitElementById } from '../common/await_functions';

export interface PicklistProps {
  persistence: PersistenceClass;
  pageTypes: string[];
  usingPage: string;
  items: PicklistItem[];
  onFocusInDashboard?: (elementId: string) => Promise<void>;
  onMouseOver: (elementId: string) => void
  onMouseOut: (elementId: string) => void
}
export const Picklist: React.FC<PicklistProps> = ({
  persistence,
  pageTypes,
  items,
  usingPage,
  onFocusInDashboard,
  onMouseOver,
  onMouseOut
}) => {
  const toItemIndex = (elementId: string | null, items: PicklistItem[]): number =>
    elementId === null ? -1 : items.findIndex((item, index) => (item.elementId ?? toCardElementId(index)) === elementId)

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
      for (const item of items) {
        const optionElement = await awaitElementById(`${item.elementId}-option`)
        let parentElement = optionElement.parentElement
        while (parentElement && parentElement.tagName !== 'LI') { parentElement = parentElement.parentElement }
        if (parentElement === null) {
          parentElement = optionElement
        }
        parentElement.addEventListener('mouseover', () => onMouseOver(item.elementId))
        parentElement.addEventListener('mouseout', () => onMouseOut(item.elementId))
      }
    }
    applyMouseOverandOutToItemTemplateParent()
  })

  const openSelectedInPage = (page: string) => {
    let index = toItemIndex(selectedElementId, items)
    if (index < 0) index = 0
    switch (page) {
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
  interface PickOptionValue {
    elementId: string;
    color: string;
    item: PicklistItem
  }
  function render() {
    const picklistLabelValue: PickOption<PickOptionValue>[] = items.map((item, index) => ({
      label: item.label(),
      value: {
        elementId: item.elementId ?? toCardElementId(index),
        color: item.color(),
        item,
      }
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
          <tr style={{ alignItems: 'center', verticalAlign: 'top' }}>
            <td style={{ display: 'flex' }}>
              <PickList
                options={picklistLabelValue}
                value={picklistLabelValue.find(({ value }) => value.elementId === selectedElementId)}
                onChange={(value: PickOptionValue) => onItemSelect((value ?? { elementId: null }).elementId)}
                maxWidthPx={475}
                style={{ width: '100%' }}
                fixedWidth={false}
                itemTemplate={(option) => (
                  <div
                    id={`${option.value.elementId}-option`}
                    className='item-picklist-option'
                    style={
                      {
                        '--border-color-left': `3px solid ${option.value.color}`,
                      } as React.CSSProperties
                    }
                  >
                    {option.label}
                  </div>
                )}
                placeholder='Pick Item for Dashboard / Status Focus'
              />
            </td>
          </tr><tr style={{ alignItems: 'center', verticalAlign: 'top' }}>
            <td style={{ display: 'flex' }}>
              {pageTypes.filter(page => page !== 'dashboard' || usingPage !== 'dashboard').map((name, index) =>
                <Button
                  style={{ marginLeft: 0 < index ? '3px' : '0px', marginTop: '3px' }}
                  className="app-button"
                  onClick={() => openSelectedInPage(name)}
                >Open {toTitleCase(name)}</Button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
  return render();
};