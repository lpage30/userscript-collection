import React, { useState} from "react";
import { InfoDisplayItem } from './datatypes'
import "../common/ui/styles.css";

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
      displayLines.map(line =>(
          <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
            <td className="text-sm text-center">{line}</td>
          </tr>
        )
      )
        
    }
  </tbody></table>
};
export default InfoDisplay;
