import React, { useState } from 'react';
import '../../common/ui/styles.css';
import { Dialog } from 'primereact/dialog';
import { AIStatusReport, isDifferentAIStatusReport } from '../ai_service_types';
import { formatFileDate } from '../../common/datetime';


interface AIAssistantProxyDashboardProps {
  initialReport: { [site: string]: AIStatusReport}
  registerAIStatusReportChange: (updateAIStatusReport: (report: { [site: string]: AIStatusReport}) => void) => void
}

const AIAssistantProxyDashboard: React.FC<AIAssistantProxyDashboardProps> = ({ initialReport, registerAIStatusReportChange}) => {
  const [aiStatusReport, setAiStatusReport] = useState<{ [site: string]: AIStatusReport}>(initialReport)
  const [visible, setVisible] = useState(true);

  registerAIStatusReportChange((report: { [site: string]: AIStatusReport}) => {
    if (isDifferentAIStatusReport(report, aiStatusReport)) {
      setAiStatusReport(report)
    }
  })

  const render = () => {
    const currentDate = new Date()
      
    return (
      <Dialog
        showHeader={true}
        closable={false}
        position={'center'}
        modal
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: '90vw', height: '90vh' }}
        header={<>
          <h2>AI Assistant Proxy</h2>
          <sub>{formatFileDate(currentDate)}</sub>
        </>}
        className='p-dialog-maximized'
      >
        <table
          style={{
            tableLayout: 'auto',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '0',
            marginBottom: 'auto',
            width: '100%',
        }}
        >
          <thead>
            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
              <th>Site</th><th>Total Requests</th><th>Total Responses</th><th>Oldest Date</th><th>Newest Date</th>
            </tr>
          </thead>
          <tbody>{Object.keys(aiStatusReport).sort().map(site => 
            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
              <td>{site}</td>
              <td>{aiStatusReport[site].totalRequests}</td>
              <td>{aiStatusReport[site].totalResponses}</td>
              <td>{formatFileDate(aiStatusReport[site].oldest)}</td>
              <td>{formatFileDate(aiStatusReport[site].newest)}</td>
            </tr>
          )}</tbody>
        </table>
      </Dialog>
    );
  };
  return render();
};

export default AIAssistantProxyDashboard;
