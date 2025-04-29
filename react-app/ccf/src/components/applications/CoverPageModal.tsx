import { ApplicationDetails, ResearchApplication, NonResearchApplication } from "../../types/application-types";
import { Modal } from "../modal/modal";
import './CoverPageModal.css'
import '../../pages/application-form/subquestions/SubForm.css'
import ReviewApplication from "../../pages/application-form/subquestions/Review";

interface CoverPageModalProps {
    application: ResearchApplication & ApplicationDetails;
    isOpen: boolean;
    onClose: () => void;
}

const CoverPageModal = ({application, isOpen, onClose}: CoverPageModalProps) => {

    const researchCoverPage = (
      <div>
        <ReviewApplication type={application.grantType} formData={application} hideFile={true}></ReviewApplication>
      </div>
    )

    
    return (
        <div>
            <Modal isOpen={isOpen} onClose={onClose} children={researchCoverPage}></Modal>
        </div>
    );
}

export default CoverPageModal