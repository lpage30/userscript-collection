import React, { useState } from 'react';
import '../../common/ui/styles.css';
import {
  aggregateJobs,
  storeJobs,
} from "../jobCollections";
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { JobApplication } from '../jobApplication';

interface CollectedJobBrowserProps {
    onJobApplicationChange: (aggregatedJobs: JobApplication[]) => void
    registerJobAggregation: (updateAggregations: (aggregatedJobs: JobApplication[]) => void) => void

}
const CollectedJobBrowser: React.FC<CollectedJobBrowserProps> = ({onJobApplicationChange, registerJobAggregation}) => {
    const [jobApplications, setJobApplications] = useState<JobApplication[]>(aggregateJobs())
    const [deletedApplicationIndices, setDeletedApplicationIndices] = useState<number[]>([])
    const [selectedApplicationId, setSelectedApplicationId] = useState<number>(null)

    const handleUpdate = (aggregatedJobs: JobApplication[]) => {
        setSelectedApplicationId(null)
        setDeletedApplicationIndices([])
        setJobApplications(aggregatedJobs)
    }
    registerJobAggregation(handleUpdate)
    const refresh = () => {
        setSelectedApplicationId(null)
        setDeletedApplicationIndices([])
        setJobApplications(aggregateJobs())
        onJobApplicationChange(jobApplications)
    }

    const toggleDelete = () => {
        if (deletedApplicationIndices.includes(selectedApplicationId)) {
            setDeletedApplicationIndices(deletedApplicationIndices.filter(value => value !== selectedApplicationId))
        } else {
            setDeletedApplicationIndices([...deletedApplicationIndices, selectedApplicationId])
        }
    }

    const apply = () => {
        storeJobs(jobApplications.filter((j, index) => !deletedApplicationIndices.includes(index)))
        refresh()
    }
    const render = () => {
        const picklistOptions = jobApplications.map((job, index) => ({
            label: `${job.source}: ${job.position}@${job.company}`,
            value: index,
            markedForDeletion: deletedApplicationIndices.includes(index),
            descriptionUrl: job.jobDescriptionUrl
        }))
        return (<table
            style={{
                tableLayout: 'auto',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: '0',
                marginBottom: 'auto',
                width: '100%',
            }}
        ><tbody>
        <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
            <td>
                <Dropdown 
                    options={picklistOptions}
                    optionLabel={'label'}
                    optionValue={'value'}
                    value={selectedApplicationId}
                    onChange={(e) => setSelectedApplicationId(e.value)}
                    highlightOnSelect={false}
                    style={{ width: '100%' }}
                    itemTemplate={(option) => (<span>{
                        option.markedForDeletion
                        ? <s>{option.label}</s>
                        : option.label
                        }</span>
                    )}
                    placeholder='Job Applications'
                />
                <div style={{display: 'flex'}}>
                    <Button 
                        onClick={() => toggleDelete()} 
                        disabled={null === selectedApplicationId}
                    >
                        {picklistOptions[selectedApplicationId].markedForDeletion ? 'Restore' : 'Delete'} {picklistOptions[selectedApplicationId].label}
                    </Button>
                    <Button 
                        onClick={() => apply()} 
                        disabled={0 === deletedApplicationIndices.length}
                    >
                        Apply {deletedApplicationIndices.length} Deletions
                    </Button>
                    <Button 
                        onClick={() => refresh()} 
                    >
                        Refesh
                    </Button>
                </div>
            </td>
            <td>{null !== selectedApplicationId && <iframe src={picklistOptions[selectedApplicationId].descriptionUrl}></iframe>}</td>
        </tr>
        </tbody></table>
        )
    }
    return render()
}
export default CollectedJobBrowser