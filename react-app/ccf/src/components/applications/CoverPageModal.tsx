import { ApplicationDetails, ResearchApplication, NonResearchApplication, Application } from "../../types/application-types";
import { Modal } from "../modal/modal";
import './CoverPageModal.css'
import '../../pages/application-form/subquestions/SubForm.css'
import Review from "../../pages/application-form/subquestions/Review";
import { useEffect, useState } from "react";
import { downloadPDFsByName } from "../../storage/storage";
import blueDocument from '../../assets/blueDocumentIcon.png';

interface CoverPageModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
}

const CoverPageModal = ({ application, isOpen, onClose }: CoverPageModalProps) => {

  const [pdfLink, setPdfLink] = useState<any>();

  useEffect(() => {
    if (isOpen) {
      downloadPDFsByName([application.file]).then((links) => {
        if (links && links[0]) {
          setPdfLink(links[0])
        }
      }).catch((e) => {
        console.error(e)
      })
    }
  }, [isOpen])

  const researchCoverPage = (
    <div className="cover-page-modal-child">
      <div className="header-row">
        <img src={blueDocument} alt="Document Icon" className="section-icon" />
        <div>
          <h2 className="title">{application.title}</h2>
          <p className="subtitle">{application.grantType}</p>
        </div>
      </div>
      {pdfLink && (
        <a
          target="_blank"
          href={pdfLink.url}
          className="pdf-link"
          rel="noopener noreferrer"
        >
          View Application PDF
        </a>
      )}
      <div className="section-divider" />
      <div className="review-section">
        <Review type={application.grantType} formData={application} hideFile={true} />
      </div>
    </div>
  )


  return (
    <Modal isOpen={isOpen} onClose={onClose} children={researchCoverPage} fullscreen={true}></Modal>
  );
}

export default CoverPageModal