import React, { useState, JSX, CSSProperties } from "react";
import { InfoDisplayItem } from './datatypes'
import "../common/ui/styles.scss";

export interface Padding { value: number, type: 'px' | 'rem' }
const paddingToString = (padding?: Padding) => padding ? `${padding.value}${padding.type}` : undefined

interface InfoDisplayProps {
  registerDisplayTrigger: (displayTrigger: (data: InfoDisplayItem | null) => void) => void
  textPaddingLeft?: Padding
  titlePaddingLeft?: Padding
}
export const InfoDisplay: React.FC<InfoDisplayProps> = ({
  registerDisplayTrigger,
  textPaddingLeft,
  titlePaddingLeft = { value: 1.5, type: 'rem' }
}) => {
  const [displayLines, setDisplayLines] = useState<string[]>([])
  if (registerDisplayTrigger) {
    registerDisplayTrigger((data: InfoDisplayItem | null) => {
      if (data === null) {
        setDisplayLines([])
        return
      }
      try {
        setDisplayLines(data.displayLines())
      } catch (e) {
        console.error(`Failed setting displayLines for InfoDisplay. ${JSON.stringify(data as any, null, 2)}`, e)
        setDisplayLines([])
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
        displayLines.map((line, index) => {
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
export default InfoDisplay;
