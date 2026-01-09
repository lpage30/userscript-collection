import React, { useState, CSSProperties } from 'react'
import { Button } from 'primereact/button'
import { parseNumber } from '../../common/functions'
interface ValueProps {
    min?: number
    max?: number
    value: number
    onChange: (value: number) => void
}

interface NumberSpinnerProps {
    minValue?: ValueProps
    maxValue?: ValueProps
    prefix?: string
    suffix?: string
    buttonLayout?: 'horizontal' | 'vertical'
    spinnerLayout?: 'horizontal' | 'vertical'
    valueDisplayFormat?: (value: number) => string
    step?: number
    containerStyle?: CSSProperties
}
export function NumberSpinner({
    minValue,
    maxValue,
    prefix,
    suffix,
    buttonLayout = 'horizontal',
    spinnerLayout = 'horizontal',
    valueDisplayFormat,
    step = 0.25,
    containerStyle
}: NumberSpinnerProps) {
    const [minvalue, setMinvalue] = useState<number>(minValue ? minValue.value : null)
    const [maxvalue, setMaxvalue] = useState<number>(maxValue ? maxValue.value : null)
    if ([minValue, maxValue].every(v => [null, undefined].includes(v))) {
        throw new Error(`Missing both Min and Max Values, provide one or other or both.`)
    }
    const handleMinValueChange = (newValue: number) => {
        setMinvalue(newValue)
        minValue.onChange(newValue)
    }

    const handleMaxValueChange = (newValue: number) => {
        setMaxvalue(newValue)
        maxValue.onChange(newValue)
    }

    const SpinningNumber = (useMinValue = true, hasParent = true) => {
        const handleValue = useMinValue ? handleMinValueChange : handleMaxValueChange
        const getValue = useMinValue ? () => minvalue : () => maxvalue
        const minusDisabled = useMinValue ? (undefined !== minValue.min ? minvalue <= minValue.min : false) : (maxValue.min ? maxvalue <= maxValue.min : false)
        const plusDisabled = useMinValue ? (undefined !== minValue.max ? minValue.max <= minvalue : false) : (maxValue.max ? maxValue.max <= maxvalue : false)
        const handleInput = (value: string) => handleValue(parseNumber(value))
        const formattedValue = () => `${prefix ?? ''}${valueDisplayFormat ? valueDisplayFormat(getValue()) : getValue()}${suffix ?? ''}`
        return (
            <div style={{ display: 'flex', flexDirection: ('horizontal' === buttonLayout ? 'row' : 'column'), ...(hasParent ? {} : containerStyle ?? {}) }}>
                <Button disabled={minusDisabled} className={'p-button-secondary'} icon={'pi pi-minus'} onClick={() => handleValue(getValue() - step)} />
                <input className={'app-button'} type='text' style={{ padding: '0.5rem'}} value={formattedValue()} onInput={(e) => handleInput(e.currentTarget.value)}/>
                <Button disabled={plusDisabled} className={'p-button-secondary'} icon={'pi pi-plus'} onClick={() => handleValue(getValue() + step)} />
            </div>
        )
    }
    if ([minValue, maxValue].some(v => [undefined, null].includes(v))) {
        return (<>
            {undefined !== minValue && SpinningNumber(true, false)}
            {undefined !== maxValue && SpinningNumber(false, false)}
        </>
        )
    }
    return (
        <div style={{ display: 'flex', flexDirection: ('horizontal' === spinnerLayout ? 'row' : 'column'), ...(containerStyle ?? {})}}>
            {SpinningNumber(true)}
            {SpinningNumber(false)}
        </div>
    )
}