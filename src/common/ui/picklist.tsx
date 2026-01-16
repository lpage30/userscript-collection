import React, { useState, KeyboardEvent, useEffect } from "react";
import { getMaximumZIndex } from './style_functions'
import "./styles.scss";

interface PicklistClassNames {
    container: string,
    placeholder: string,
    trigger: string,
    icon: string,
    listPanel: string,
    listContainer: string,
    list: string,
    listItem: string,
    listItemLabel: string,
    listItemLabelContent: string

}
const picklistClasses: PicklistClassNames = {
    container: 'p-dropdown p-component p-inputwrapper',
    placeholder: 'p-dropdown-label p-inputtext p-placeholder',
    trigger: 'p-dropdown-trigger',
    icon: 'p-icon p-dropdown-trigger-icon p-clickable',
    listPanel: 'p-dropdown-panel p-component p-ripple-disabled p-connected-overlay-enter-done',
    listContainer: 'p-dropdown-items-wrapper',
    list: 'p-dropdown-items',
    listItem: 'picklist-list-item',
    listItemLabel: 'p-dropdown-item-label',
    listItemLabelContent: 'item-picklist-option',
}

export interface PickOption<T = string> {
    value: T;
    label: string;
}

export interface PickListProps<T = string> {
    options: Array<PickOption<T>>;
    value?: Array<PickOption<T>> | PickOption<T>;
    multiple?: boolean;
    fixedWidth?: boolean;
    maxWidthPx?: number;
    pxPerCharacter?: number;
    showSelectAll?: boolean;
    selectAllLabel?: string;
    onChange?: (value: T | T[] | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    selectedDisplayMax?: number;
    itemTemplate?: React.ReactNode | ((option: any) => React.ReactNode) | undefined;
}

export function PickList<T = string>({
    options,
    value = [],
    multiple = false,
    fixedWidth = true,
    maxWidthPx,
    pxPerCharacter = 5,
    showSelectAll,
    selectAllLabel,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className,
    style,
    selectedDisplayMax,
    itemTemplate
}: PickListProps<T>) {
    const [state, setState] = useState<{
        open: boolean,
        selectedOptions: Array<PickOption<T>>
    }>({
        open: false,
        selectedOptions: Array.isArray(value) ? value : value ? [value] : []
    })
    showSelectAll = showSelectAll ?? multiple
    useEffect(() => {
        if (onChange) {
            const selection = [...state.selectedOptions.map(opt => opt.value)]
            onChange(multiple ? selection : 0 === selection.length ? null : selection[0])
        }
    })

    const onSelectOptions = (option: PickOption<T> | PickOption<T>[], select: boolean): void => {
        if (Array.isArray(option)) {
            setState({
                open: multiple ? state.open : false,
                selectedOptions: select ? option : []
            })
            return
        }
        let newSelectedOptions = [...state.selectedOptions]
        const foundIndex = newSelectedOptions.findIndex((opt) => opt.value === option.value)
        if ((0 <= foundIndex && select) || (!select && foundIndex < 0)) {
            return
        }
        if (select) {
            newSelectedOptions = multiple ? [...newSelectedOptions, option] : [option]
        } else {
            newSelectedOptions = newSelectedOptions.filter((o, index) => index !== foundIndex)
        }
        setState({
            open: multiple ? state.open : false,
            selectedOptions: newSelectedOptions
        })
    }

    const isSelectAll = (): boolean => state.selectedOptions.length == options.length
    const isSelected = (option: PickOption<T>) => {
        return isSelectAll() ? true : state.selectedOptions.some((opt) => opt.label === option.label)
    }
    const getMaxPlaceholderText = (): string => {
        const opts: PickOption<T>[] = [...options].sort((l, r) => r.label.length - l.label.length)
        const maxselectDisplay = opts.slice(0, selectedDisplayMax ?? (state.selectedOptions.length - 1)).map(({ label }) => label)
        const maxString = [
            `${opts.length} (All) items selected`,
            maxselectDisplay.join(','),
            placeholder,
            ...opts.map(({ label }) => label)
        ].sort((l, r) => r.length - l.length)[0]
        return maxString
    }
    const getPlaceholderText = (): string => {
        if (isSelectAll() || (selectedDisplayMax && selectedDisplayMax <= state.selectedOptions.length)) {
            return `${state.selectedOptions.length}${isSelectAll() ? ' (All) ' : ' '}items selected`
        }
        if (0 < state.selectedOptions.length) {
            return state.selectedOptions.map(opt => opt.label).join(',')
        }
        return placeholder
    }
    const setOpen = (open: boolean | ((oldState: boolean) => boolean)) => {
        if (typeof open === 'boolean') {
            setState({ ...state, open })
            return
        }
        setState({ ...state, open: open(state.open) })
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true)
        }
        if (e.key === "Escape") setOpen(false)
    }
    const toOptionLabel = (opt: PickOption<T>, selected: boolean): React.ReactNode => {
        if (itemTemplate) {
            if (typeof itemTemplate === 'function') {
                return itemTemplate(opt)
            }
            return itemTemplate
        }
        return (
            <span className={picklistClasses.listItemLabel}>
                <div className={picklistClasses.listItemLabelContent}>
                    {selected ? <b>{opt.label}</b> : opt.label}
                </div>
            </span>
        )
    }
    const maxPxWidth = maxWidthPx ? Math.min(maxWidthPx, getMaxPlaceholderText().length * pxPerCharacter) : getMaxPlaceholderText().length * pxPerCharacter
    return (
        <div
            className={`${picklistClasses.container} ${className ?? ''}`}
            onKeyDown={onKeyDown} tabIndex={disabled ? -1 : 0}
            style={{ ...(style ?? {}), ...(fixedWidth ? { width: `${maxPxWidth}px` } : {}) }}
        >
            <span
                className={picklistClasses.placeholder}
                tabIndex={-1}
                onClick={() => !disabled && setOpen((s) => !s)}
            >{getPlaceholderText()}</span>
            <div className={picklistClasses.trigger}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={state.open}
                onClick={() => !disabled && setOpen((s) => !s)}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"
                    className={picklistClasses.icon}
                >
                    <path d="M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z" fill="currentColor"></path>
                </svg>
            </div>
            {state.open && (
                <div
                    className={picklistClasses.listPanel}
                    style={{ top: '100%', zIndex: (getMaximumZIndex() + 1) }}
                >
                    <div className={picklistClasses.listContainer} style={{ maxHeight: '200px' }}>
                        <ul className={picklistClasses.list} role="listbox" aria-label="Option List" aria-multiselectable={multiple}>
                            {multiple && (showSelectAll ?? multiple) && options.length > 0 && (<>
                                <li
                                    role="option"
                                    className={picklistClasses.listItem}
                                    tabIndex={0}
                                    aria-selected={isSelectAll()}
                                    onClick={() => onSelectOptions(options, !isSelectAll())}
                                >
                                    <span className={picklistClasses.listItemLabel}>
                                        <div className={picklistClasses.listItemLabelContent}>
                                            <b>{selectAllLabel ?? (`${isSelectAll() ? 'Unselect' : 'Select'} All ${options.length} items`)}</b>
                                        </div>
                                    </span>
                                </li>
                                <hr />
                            </>)}
                            {options.map((opt) => {
                                const selected = isSelected(opt)
                                return (
                                    <li
                                        role="option"
                                        className={picklistClasses.listItem}
                                        tabIndex={0}
                                        aria-selected={selected}
                                        onClick={() => onSelectOptions(opt, !selected)}
                                    >
                                        {toOptionLabel(opt, selected)}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PickList;

