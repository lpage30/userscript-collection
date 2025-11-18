import React, { useState} from "react";
import { InfoDisplayItem } from './datatypes'
import "../common/ui/styles.css";

interface InfoDisplayProps {
  registerDisplayTrigger: (displayTrigger: (data: InfoDisplayItem | null ) => void) => void

}
export const InfoDisplay: React.FC<InfoDisplayProps> = ({ registerDisplayTrigger }) => {
  const [data, setData] = useState<InfoDisplayItem | null>(null)
  if (registerDisplayTrigger) {
    registerDisplayTrigger((data: InfoDisplayItem | null ) => setData(data))
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
      (data?.displayLines() ?? []).map(line =>(
        <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
          <td className="text-sm text-center">{line}</td>
        </tr>
      ))
    }
  </tbody></table>
};
export default InfoDisplay;
