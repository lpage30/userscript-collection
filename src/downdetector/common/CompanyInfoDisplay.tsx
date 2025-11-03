import React, { useState} from "react";
import { CompanyMetadata } from "./CompanyTypes";
import "../../common/ui/styles.css";

interface CompanyInfoDisplayProps {
  registerDisplayTrigger: (displayTrigger: (company: CompanyMetadata | null ) => void) => void

}
export const CompanyInfoDisplay: React.FC<CompanyInfoDisplayProps> = ({ registerDisplayTrigger }) => {
  const [company, setCompany] = useState<CompanyMetadata | null>(null)
  if (registerDisplayTrigger) {
    registerDisplayTrigger((company: CompanyMetadata | null ) => setCompany(company))
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
      (company?.tooltipLines ?? []).map(line =>(
        <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
          <td className="text-sm text-center">{line}</td>
        </tr>
      ))
    }
  </tbody></table>
};
export default CompanyInfoDisplay;
