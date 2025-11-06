import React, { useState, useRef } from 'react';
import '../../common/ui/styles.css';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { JobApplication } from '../jobApplication';
import { JobSiteTypeArray } from '../JobCollector/sites/sites';
import { formatFileDate } from '../../common/datetime';
import { JobCollectorStatusReport } from '../job_service_types';
import CollectedJobBrowser from './CollectedJobBrowser';

interface JobCollectorDashboardProps {
  initialAggregation: JobApplication[]
  registerJobAggregation: (updateAggregations: (aggregatedJobs: JobApplication[]) => void) => void
  mergeAggregation: (aggregatedJobs: JobApplication[]) => Promise<number>
}

const JobCollectorDashboard: React.FC<JobCollectorDashboardProps> = ({
  initialAggregation, 
  registerJobAggregation,
  mergeAggregation,
}) => {
  const [aggregatedJobs, setAggregatedJobs] = useState<JobApplication[]>(initialAggregation)
  const [visible, setVisible] = useState(true);
  const updateBrowserAggregationRef = useRef<(aggregatedJobs: JobApplication[]) => void>(null)
  const [mergedCount, setMergedCount] = useState<number>(null)
  const updateAggregations = (aggregatedJobs: JobApplication[]) => {
    setAggregatedJobs(aggregatedJobs)
    if (updateBrowserAggregationRef.current) {
      updateBrowserAggregationRef.current(aggregatedJobs)
      setMergedCount(null)
    }
  }
  const handleMerge = async () => {
    setMergedCount(await mergeAggregation(aggregatedJobs))
  }

  registerJobAggregation(updateAggregations)  

  const render = () => {
    const currentDate = new Date()
    let status = aggregatedJobs.reduce((statusTable: { [site: string]: JobCollectorStatusReport}, application: JobApplication) => {
      const newRecord = {...(statusTable[application.source] ?? {})}
      newRecord['site'] = newRecord['site'] ?? application.source
      newRecord['total'] = (newRecord['total'] ?? 0) + 1
      newRecord['oldest'] = newRecord['oldest'] 
        ? (application.date < newRecord['oldest'] ? application.date : newRecord['oldest'])
        : application.date
      newRecord['newest'] = newRecord['newest'] 
        ? (application.date > newRecord['newest'] ? application.date : newRecord['newest'])
        : application.date
      return {
        ...statusTable,
        [newRecord.site]: newRecord as JobCollectorStatusReport
      }
    }, {})
    status = JobSiteTypeArray.reduce((statusTable, site) => {
      return Object.keys(statusTable).includes(site)
        ? statusTable
        : ({...statusTable, [site]: { total: 0, oldest: currentDate, newest: currentDate} as JobCollectorRecord})
      }, status)

      
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
          <div className='text-center'><h2>Job Collector Dashboard</h2></div>
          <div className='text-center'>
            <sub>{aggregatedJobs.length} Jobs Collected</sub>
          </div>
          <div style={{display: 'flex', padding: '3px', justifyContent: 'center'}}>
            <CollectedJobBrowser 
              onJobApplicationChange={updateAggregations}
              registerJobAggregation={(callback) => { updateBrowserAggregationRef.current = callback }}
            />&nbsp;&nbsp;
            <Button 
              className="app-button"
              onClick={handleMerge}
              disabled={0 === aggregatedJobs.length || null !== mergedCount}
            >{0 === aggregatedJobs.length 
                ? 'No Jobs to Merge' 
                : null !== mergedCount 
                  ? `Already Merged`
                  : 'Merge Jobs to Server'}
            </Button>
          </div>
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
              <th>Site</th><th>Total Jobs</th><th>Oldest Date</th><th>Newest Date</th>
            </tr>
          </thead>
          <tbody>{Object.keys(status).sort().map(site => 
            <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
              <td>{site}</td>
              <td>{status[site].total}</td>
              <td>{formatFileDate(status[site].oldest)}</td>
              <td>{formatFileDate(status[site].newest)}</td>
            </tr>
          )}</tbody>
        </table>
      </Dialog>
    );
  };
  return render();
};

export default JobCollectorDashboard;
