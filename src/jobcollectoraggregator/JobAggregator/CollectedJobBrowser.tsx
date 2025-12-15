import React, { useState } from 'react';
import '../../common/ui/styles.scss';
import {
  aggregateJobs,
  storeJobs,
} from "../jobCollections";
import { PickList, PickOption } from '../../common/ui/picklist';
import { Button } from 'primereact/button';
import { JobApplication } from '../jobApplication';
import { Dialog } from 'primereact/dialog';

interface CollectedJobBrowserProps {
    onJobApplicationChange: (aggregatedJobs: JobApplication[]) => void
    registerJobAggregation: (updateAggregations: (aggregatedJobs: JobApplication[]) => void) => void
    style?: React.CSSProperties

}
const CollectedJobBrowser: React.FC<CollectedJobBrowserProps> = ({
    onJobApplicationChange,
    registerJobAggregation,
    style
}) => {
    const [jobApplications, setJobApplications] = useState<JobApplication[]>(aggregateJobs())
    const [deletedApplicationIndices, setDeletedApplicationIndices] = useState<number[]>([])
    const [selectedApplicationIndex, setSelectedApplicationIndex] = useState<number>(null)
    const [iframeHref, setIframeHref] = useState<string>(null)
    const [visible, setVisible] = useState(false)

    const handleJobSelect = (applicationIndex: number)  => {
        setIframeHref(jobApplications[applicationIndex].jobDescriptionUrl)
        setSelectedApplicationIndex(applicationIndex)
    }
    const handleUpdate = (aggregatedJobs: JobApplication[]) => {
        setIframeHref(null)
        setSelectedApplicationIndex(null)
        setDeletedApplicationIndices([])
        setJobApplications(aggregatedJobs)
    }
    registerJobAggregation(handleUpdate)
    const refresh = () => {
        setIframeHref(null)
        setSelectedApplicationIndex(null)
        setDeletedApplicationIndices([])
        setJobApplications(aggregateJobs())
        onJobApplicationChange(jobApplications)
    }

    const toggleDelete = () => {
        if (deletedApplicationIndices.includes(selectedApplicationIndex)) {
            setDeletedApplicationIndices(deletedApplicationIndices.filter(value => value !== selectedApplicationIndex))
        } else {
            setDeletedApplicationIndices([...deletedApplicationIndices, selectedApplicationIndex])
        }
    }

    const apply = () => {
        storeJobs(jobApplications.filter((j, index) => !deletedApplicationIndices.includes(index)))
        refresh()
    }
    const popupBrowser = () => setVisible(true)
    interface PickOptionValue {
        index: number;
        markedForDeletion: boolean;
        descriptionUrl: string;        
    }
    const render = () => {
        const picklistOptions: PickOption<PickOptionValue>[] = jobApplications.map((job, index) => ({
            label: `${job.source}: ${job.position}@${job.company}`,
            value: { index,
                     markedForDeletion: deletedApplicationIndices.includes(index),
                     descriptionUrl: job.jobDescriptionUrl
            }
        }))
        return (
        <div style={style ?? {}}>
            <Button className="app-button" onClick={(() => popupBrowser())}>Browse and Manage Jobs</Button>
            <Dialog
                showHeader={true}
                closable={true}
                position={'center'}
                visible={visible}
                onHide={() => setVisible(false)}
                style={{ width: '90vw', height: '90vh' }}
                className='p-dialog-maximized'
                header={
                    <div style={{textAlign: 'center'}}>
                        <h2>Select Job, Browse and Manage</h2>
                        <div style={{display: 'flex', padding: '3px', justifyContent: 'center'}}>
                            <Button 
                                className="app-button"
                                onClick={() => toggleDelete()} 
                                disabled={null === selectedApplicationIndex}
                            >{selectedApplicationIndex !== null
                                ? `${picklistOptions[selectedApplicationIndex].value.markedForDeletion ? 'Restore' : 'Delete'}`
                                : 'disabled'
                            }
                            </Button>
                            <Button 
                                className="app-button"
                                onClick={() => apply()} 
                                disabled={0 === deletedApplicationIndices.length}
                            >
                                Apply {deletedApplicationIndices.length} Deletions
                            </Button>
                            <Button
                                className="app-button" 
                                onClick={() => refresh()} 
                            >
                                Refesh
                            </Button>
                            <Button
                                className="app-button"
                                onClick={() => apply()} 
                                disabled={0 === deletedApplicationIndices.length}
                            >
                                Apply {deletedApplicationIndices.length} Deletions
                            </Button>
                        </div>

                    </div>
                }
            >
                <table
                    style={{
                        tableLayout: 'auto',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        marginTop: '0',
                        marginBottom: '0',
                        height: '100%',
                        width: '100%',
                    }}><tbody>
                    <tr style={{ alignItems: 'center', verticalAlign: 'center' }}>
                        <td style={{padding: '3px'}}>
                            <PickList 
                                options={picklistOptions}
                                value={picklistOptions.find(opt => opt.value.index === selectedApplicationIndex)}
                                onChange={(selected: PickOptionValue)=> handleJobSelect(selected.index)}
                                style={{ width: '100%' }}
                                itemTemplate={(option) => (<span>{
                                    option.value.markedForDeletion
                                    ? <s>{option.label}</s>
                                    : option.label
                                    }</span>
                                )}
                                placeholder={`Collected Jobs (${picklistOptions.length}) Picklist - Pick one`}
                            />
                        </td>
                    </tr>
                    <tr style={{width: '100%', height: '100%', top: 0, left: 0 }}>
                        <td>
                            <iframe 
                                src={iframeHref}
                                style={{ width: '100%', height: '100%'}}
                            ></iframe>    
                        </td>
                    </tr>
                </tbody></table>
            </Dialog>
        </div>
        )
    }
    return render()
}
export default CollectedJobBrowser