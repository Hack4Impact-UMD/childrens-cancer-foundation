import { ApplicationDetails, ResearchApplication, NonResearchApplication, Application } from "../../types/application-types";
import { DynamicApplication } from "../../types/form-template-types";
import { Modal } from "../modal/modal";
import './CoverPageModal.css'
import '../../pages/application-form/subquestions/SubForm.css'
import Review from "../../pages/application-form/subquestions/Review";
import DynamicReview from "./DynamicReview";
import { useEffect, useState } from "react";
import { downloadPDFsByName } from "../../storage/storage";
import blueDocument from '../../assets/blueDocumentIcon.png';

interface CoverPageModalProps {
  application: Application | DynamicApplication;
  isOpen: boolean;
  onClose: () => void;
}

const CoverPageModal = ({ application, isOpen, onClose }: CoverPageModalProps) => {

  const [pdfLink, setPdfLink] = useState<any>();

  // Helper function to check if application is dynamic
  const isDynamicApplication = (app: Application | DynamicApplication): app is DynamicApplication => {
    return 'formTemplateId' in app && 'formData' in app;
  };

  useEffect(() => {
    if (isOpen && application.file) {
      downloadPDFsByName([application.file]).then((links) => {
        if (links && links[0]) {
          setPdfLink(links[0])
        }
      }).catch((e) => {
        console.error(e)
      })
    }
  }, [isOpen, application.file])

  const getApplicationTitle = () => {
    if (isDynamicApplication(application)) {
      return application.title || 'Dynamic Application';
    }
    return application.title || 'Application';
  };

  const getApplicationGrantType = () => {
    if (isDynamicApplication(application)) {
      return application.grantType;
    }
    return application.grantType;
  };

  const modalContent = (
    <div className="cover-page-modal-child">
      <div className="header-row">
        <img src={blueDocument} alt="Document Icon" className="section-icon" />
        <div>
          <h2 className="title">{getApplicationTitle()}</h2>
          <p className="subtitle">{getApplicationGrantType()}</p>
          {isDynamicApplication(application) && (
            <p className="dynamic-indicator">✨ Dynamic Form Application</p>
          )}
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
        {isDynamicApplication(application) ? (
          <DynamicReview application={application} hideFile={true} />
        ) : (
          <Review type={application.grantType} formData={application} hideFile={true} />
        )}
      </div>
    </div>
  )


  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'viewport-90'} children={modalContent}></Modal>
  );
}

export default CoverPageModal