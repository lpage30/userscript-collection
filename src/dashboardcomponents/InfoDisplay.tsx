import React, { useState, JSX, CSSProperties } from "react";
import { InfoDisplayItem } from './datatypes'
import "../common/ui/styles.scss";

interface InfoDisplayProps {
  registerDisplayTrigger: (displayTrigger: (data: InfoDisplayItem | null ) => void) => void

}
export const InfoDisplay: React.FC<InfoDisplayProps> = ({ registerDisplayTrigger }) => {
  const [displayLines, setDisplayLines] = useState<string[]>([])
  if (registerDisplayTrigger) {
    registerDisplayTrigger((data: InfoDisplayItem | null ) => {
      if (data === null) {
        setDisplayLines([])
        return
      }
      try {
        setDisplayLines(data.displayLines())
      } catch (e) {
        console.error(`Failed setting displayLines for InfoDisplay. ${JSON.stringify(data as any,null, 2)}`, e)
        setDisplayLines([])
      }
    })
  }
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
        let cell: JSX.Element = <td className={'text-sm'} style={{paddingLeft: '2rem'}}>{line}</td>
        if (index === 0) {
          cell = <th className={'text-sm'} style={{paddingLeft: '4rem'}}><h6>{line}</h6></th>
        }
        return (
          <tr style={{verticalAlign: 'center'}}>
            {cell}
          </tr>
        )
      })
        
    }
  </tbody></table>
};
export default InfoDisplay;
