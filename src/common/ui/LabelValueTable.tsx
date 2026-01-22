import React, { JSX, CSSProperties } from 'react'

interface LabelValueTableProps {
    id: string,
    labelValueArray: [string, JSX.Element][]
    border?: boolean
}
export const LabelValueTable: React.FC<LabelValueTableProps> = ({
    id,
    labelValueArray,
    border
}) => {
    const borderStyle: CSSProperties = {
        border: '1px solid black',
        borderCollapse: 'collapse',
    }
    return (
        <table
            id={id}
            style={{
                tableLayout: 'auto',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: '0',
                marginBottom: 'auto',
                width: '100%',
                padding: 0,
                ...(true === border ? borderStyle : {})

            }}
        ><tbody>
                {labelValueArray.map(([label, value]) => (
                    <tr style={{ ...(true === border ? borderStyle : {}) }}>
                        <td style={{ verticalAlign: 'top', padding: 5, margin: 0, ...(true === border ? borderStyle : {}) }} className={'text-left'}>{label}:</td>
                        <td style={{ verticalAlign: 'top', padding: 5, margin: 0, ...(true === border ? borderStyle : {}) }} className={'text-left'}>{value}</td>
                    </tr>
                ))}
            </tbody></table>
    )
}