import React, { useState, JSX, CSSProperties } from "react";
import { InfoDisplayItem } from './datatypes'
import "../common/ui/styles.scss";

export interface Padding { value: number, type: 'px' | 'rem' }
const paddingToString = (padding?: Padding) => padding ? `${padding.value}${padding.type}` : undefined

export interface InfoDisplayProps {
  registerDisplayTrigger: (displayTrigger: (data: InfoDisplayItem | null) => void) => void
  textPaddingLeft?: Padding
  titlePaddingLeft?: Padding
}
export const InfoDisplay: React.FC<InfoDisplayProps> = ({
  registerDisplayTrigger,
  textPaddingLeft,
  titlePaddingLeft = { value: 1.5, type: 'rem' }
}) => {
  const [state, setState] = useState<{
    displayLines: string[]
  }>({ displayLines: [] })
  if (registerDisplayTrigger) {
    registerDisplayTrigger((data: InfoDisplayItem | null) => {
      if (data === null) {
        setState({ displayLines: [] })
        return
      }
      try {
        setState({
          displayLines: data.displayLines(),
        })
      } catch (e) {
        console.error(`Failed setting displayLines for InfoDisplay. ${JSON.stringify(data as any, null, 2)}`, e)
        setState({ displayLines: [] })
      }
    })
  }
  const textLeftPadding = paddingToString(textPaddingLeft)
  const titleLeftPadding = paddingToString(titlePaddingLeft)
  return <table style={{
    tableLayout: 'auto',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '0',
    marginBottom: 'auto',
    width: '100%',
  }}
  ><tbody>
      {
        state.displayLines.map((line, index) => {
          let cell: JSX.Element = <td className={'text-sm'} style={{ paddingLeft: textLeftPadding ? textLeftPadding : 0 }}>{line}</td>
          if (index === 0) {
            cell = <th className={'text-lg'} style={{ paddingLeft: titleLeftPadding ? titleLeftPadding : 0 }}>{line}</th>
          }
          return (
            <tr style={{ alignItems: 'left', textAlign: 'left' }}>
              {cell}
            </tr>
          )
        })
      }
    </tbody></table>
};

