import { ApplicationDetails, ResearchApplication, NonResearchApplication, Application } from "../../types/application-types";
import { Modal } from "../modal/modal";
import './CoverPageModal.css'
import '../../pages/application-form/subquestions/SubForm.css'
import Review from "../../pages/application-form/subquestions/Review";
import { useEffect, useState } from "react";
import { downloadPDFsByName } from "../../storage/storage";
import { PostGrantReport } from "../../types/post-grant-report-types";
import { getReportByApplicationID } from "../../backend/post-grant-reports";
import { getCurrentCycle } from "../../backend/application-cycle";

interface CoverPageModalProps {
    application: Application;
    isOpen: boolean;
    onClose: () => void;
}

const AdminCoverPageModal = ({application, isOpen, onClose}: CoverPageModalProps) => {

  const [pdfLink, setPdfLink] = useState<any>();
  const [reportLink, setReportLink] = useState<any>();
  const [reportMsg, setReportMsg] = useState<string>("");

    useEffect(() => {
      if (isOpen) {
        getCurrentCycle().then(currentAppCycle => {
            downloadPDFsByName([application.file]).then((links) => {
                if (links && links[0]) {
                setPdfLink(links[0])
                }
            }).catch((e) => {
                console.error(e)
            })
            const reportDue = (currentAppCycle.name != application.applicationCycle) || currentAppCycle.stage == "Final Decision"
            if (application.applicationId && reportDue) {
                getReportByApplicationID(application.applicationId).then(report => {
                    console.log(report)
                    downloadPDFsByName([report.file]).then((links) => {
                        if (links && links[0]) {
                            setReportLink(links[0])
                        }
                    }).catch(e => {
                        console.error(e)
                    })
                }).catch(err => {
                    if (err.message == "Not Found") {
                        setReportMsg("Post-Grant Report Not Submitted")
                    } else {
                        console.error(err)
                    }
                })
            }
        })
    }
    },[isOpen])

    const researchCoverPage = (
      <div className="cover-page-modal-child">
        <div className="funding-info">{application.decision}</div>
            <div className="application-pdf-link">{pdfLink ? <a target="_blank" href={pdfLink.url}>Application PDF</a>: ""}</div>
            <div className="post-grant-report-pdf-link">{reportLink ? <a target="_blank" href={reportLink.url}>Post Grant Report</a>: reportMsg}</div>
        <Review type={application.grantType} formData={application} hideFile={true}></Review>
      </div>
    )

    
    return (
      <Modal isOpen={isOpen} onClose={onClose} children={researchCoverPage} fullscreen={true}></Modal>
    );
}

export default AdminCoverPageModal