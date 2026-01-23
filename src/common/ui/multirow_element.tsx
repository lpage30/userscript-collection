import React, { JSX, CSSProperties } from 'react'
export interface MultirowArrayItem {
    id: string
    getElement: (isFirst: boolean, isLast: boolean, onClick?: () => void) => JSX.Element
}
export interface MultirowElementProps {
    items: MultirowArrayItem[]
    itemsPerRow: number
    onClick?: (itemId: string) => void
    rowStyle?: CSSProperties
    cellStyle?: CSSProperties
    rowCellDivContainerStyle?: CSSProperties
    titleElement?: JSX.Element
}


export const MultirowElement: React.FC<MultirowElementProps> = ({
    items,
    itemsPerRow,
    onClick,
    rowStyle = { alignItems: 'center', verticalAlign: 'bottom' },
    cellStyle = { alignItems: 'center', verticalAlign: 'bottom' },
    rowCellDivContainerStyle = { display: 'flex', alignItems: 'center' },
    titleElement
}) => {
    const rows: MultirowArrayItem[][] = items.
        reduce((rows, item, index) => {
            if (0 === (index % itemsPerRow)) {
                rows.push([])
            }
            rows[rows.length - 1].push(item)
            return rows
        }, [] as MultirowArrayItem[][])

    return (
        <>{
            rows.map((row, index) => (
                <tr style={rowStyle}>
                    {0 === index && titleElement && <td style={{ textAlign: 'right' }}>{titleElement}</td>}
                    {0 !== index && titleElement && <td></td>}
                    <td style={cellStyle}>
                        <div style={rowCellDivContainerStyle}>{
                            row.map((cell, cellIndex) => {
                                const isFirst = 0 === cellIndex
                                const isLast = row.length <= (cellIndex + 1)
                                const onElementClick = onClick ? () => onClick(cell.id) : undefined
                                return cell.getElement(isFirst, isLast, onElementClick)
                            })
                        }</div>
                    </td>

                </tr>
            ))
        }</>
    )
}
