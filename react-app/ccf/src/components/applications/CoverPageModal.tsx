import { ApplicationDetails, ResearchApplication, NonResearchApplication } from "../../types/application-types";
import { Modal } from "../modal/modal";
import './CoverPageModal.css'
import '../../pages/application-form/subquestions/SubForm.css'

interface CoverPageModalProps {
    application: ResearchApplication & ApplicationDetails;
    isOpen: boolean;
    onClose: () => void;
}

const CoverPageModal = ({application, isOpen, onClose}: CoverPageModalProps) => {

    const researchCoverPage = (
        <div>
    <div className="form-container">
      <div className="left-container">
        <p className="text-label">Title of Project</p>
        <input
          type="text"
          name="title"
          value={application.title}
          readOnly={true}
          required
          className="text-input"
        />

        <p className="text-label">Principal Investigator</p>
        <input
          type="text"
          name="principalInvestigator"
          value={application.principalInvestigator}
          readOnly={true}  
          
          required
          className="text-input"
        />

        <p className="text-label">Types of Cancer Being Addressed</p>
        <input
          type="text"
          name="typesOfCancerAddressed"
          value={application.typesOfCancerAddressed}
          readOnly={true}  
          
          required
          className="text-input"
        />

        <p className="text-label">Name/Titles of Other Staff</p>
        <input
          type="text"
          name="namesOfStaff"
          value={application.namesOfStaff}   
          readOnly={true}  
          
          required
          className="text-input"
        />

        <p className="text-label">Institution</p>
        <input
          type="text"
          name="institution"
          value={application.institution}
          
          readOnly={true}  
          required
          className="text-input"
        />

        <p className="text-label">Address of Institution</p>
        <input
          type="text"
          name="institutionAddress"
          value={application.institutionAddress}
          readOnly={true}  
          
          required
          className="text-input"
        />
      </div>
      <div className="right-container">
        <p className="text-label">Institution Phone Number</p>
        <input
          type="text"
          name="institutionPhoneNumber"
          value={application.institutionPhoneNumber}
          readOnly={true}  
          
          required
          className="text-input"
        />

        <p className="text-label">Institution Email</p>
        <input
          type="text"
          name="institutionEmail"
          value={application.institutionEmail}         
          readOnly={true}  
          
          required
          className="text-input"
        />

        <p className="text-label">Administration Official Name</p>
        <input
          type="text"
          name="adminOfficialName"
          value={application.adminOfficialName}
          
          readOnly={true}  
          required
          className="text-input"
        />

        <p className="text-label">Address of Administration Official</p>
        <input
          type="text"
          name="adminOfficialAddress"
          value={application.adminOfficialAddress}
          readOnly={true}  
          
          required
          className="text-input"
        />

        <p className="text-label">Administration Official Phone Number</p>
        <input
          type="text"
          name="adminPhoneNumber"
          value={application.adminPhoneNumber}
          readOnly={true}
          
          required
          className="text-input"
        />

        <p className="text-label">Email of Administration Official</p>
        <input
          type="text"
          name="adminEmail"
          value={application.adminEmail}
          
          readOnly={true}  
          required
          className="text-input"
        />
      </div>
    </div>
        </div>
    );

    
    return (
        <div>
            <Modal isOpen={isOpen} onClose={onClose} children={researchCoverPage}></Modal>
        </div>
    );
}

export default CoverPageModal