import { ApplicationDetails, ResearchApplication, NonResearchApplication, Application } from "../../types/application-types";
import { Modal } from "../modal/modal";
import './CoverPageModal.css'
import '../../pages/application-form/subquestions/SubForm.css'
import Review from "../../pages/application-form/subquestions/Review";
import { useEffect, useState } from "react";
import { downloadPDFsByName } from "../../storage/storage";

interface CoverPageModalProps {
    application: Application;
    isOpen: boolean;
    onClose: () => void;
}

const CoverPageModal = ({application, isOpen, onClose}: CoverPageModalProps) => {

  const [pdfLink, setPdfLink] = useState<any>();

    useEffect(() => {
      downloadPDFsByName([application.file]).then((links) => {
        if (links && links[0]) {
          setPdfLink(links[0])
        }
      }).catch((e) => {
        console.error(e)
      })
    },[])

    const researchCoverPage = (
      <div className="cover-page-modal-child">
        {pdfLink ? <a target="_blank" href={pdfLink.url}>{pdfLink.name}</a>: ""}
        <Review type={application.grantType} formData={application} hideFile={true}></Review>
      </div>
    )

    
    return (
      <Modal isOpen={isOpen} onClose={onClose} children={researchCoverPage} fullscreen={true}></Modal>
    );
}

export default CoverPageModal