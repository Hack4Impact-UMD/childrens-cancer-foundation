import {useState} from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import {useNavigate} from 'react-router-dom';
import Information from './subquestions/Information';
import ApplicationQuestions from './subquestions/ApplicationQuestions';
import ReviewApplication from './subquestions/Review';
import GrantProposal from './subquestions/GrantProposal';
import AboutGrant from './subquestions/AboutGrant';
import {ResearchApplication} from '../../types/application-types';
import {uploadResearchApplication} from '../../backend/applicant-form-submit';

type ApplicationFormProps = {
    type: "Research" | "NextGen";
};

function ApplicationForm({ type }: ApplicationFormProps): JSX.Element {
    const [currentPage, setCurrentPage] = useState(1);
    const pages = type === "Research"
        ? ["Grant Proposal", "About Grant", "My Information", "Application Questions", "Review"]
        : ["Grant Proposal", "About Grant", "My Information", "Application Questions", "Review"];
    const totalPages = pages.length;
    const navigate = useNavigate();
    const requiredFields = [
        'title', 'principleInvestigator', 'typesOfCancerAddressed', 'namesOfStaff', 'institution', 
        'institutionAddress', 'institutionPhoneNumber', 'institutionEmail', 'adminEmail',
        'adminOfficialName', 'adminPhoneNumber', 'adminEmail', 'includedPublishedPaper', 'creditAgreement', 'patentApplied',
        'includedFundingInfo', 'amountRequested', 'dates', 'continuation', 'file'
    ]
    const [formData, setFormData] = useState({
        title: '',
        principalInvestigator: '', 
        typesOfCancerAddressed: '',
        institution: '',
        namesOfStaff: '',
        institutionAddress: '',
        institutionPhoneNumber: '',
        institutionEmail: '',
        adminOfficialName: '',
        adminOfficialAddress: '',
        adminPhoneNumber: '',
        adminEmail: '',
        includedPublishedPaper: '',
        creditAgreement: '',
        patentApplied: '',
        includedFundingInfo: '',
        amountRequested: '',
        dates: '',
        continuation: '',
        continuationYears: '',
        file: null
    });
    const goBack = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            navigate('/applicant/dashboard');
        }
    };
    const handleContinue = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
    const handleSubmit = () => {
        try {
            if (isFormValid()) {
                const application: ResearchApplication = formData as ResearchApplication
                if (formData.file)
                    uploadResearchApplication(application, formData.file, type == "NextGen")
            }
        } catch (e) {
            console.log(e)
        }

        navigate('/applicant/dashboard')
    };
    // Validation function to check if all required fields are filled
    const isFormValid = () => {
        return requiredFields.reduce((acc, curr) => (formData as any)[curr] !== '' && (formData as any)[curr] !== null && acc, true);
    };
    const renderPage = () => {
        switch (currentPage) {
            case 1:
                return <GrantProposal type={type} formData={formData} setFormData={setFormData} />;
            case 2:
                return <AboutGrant type={type} formData={formData} />;
            case 3:
                return <Information formData={formData} setFormData={setFormData} />;
            case 4:
                return <ApplicationQuestions formData={formData} setFormData={setFormData} />;
            case 5:
                return <ReviewApplication type={type} formData={formData} />;
            default:
                return null;
        }
    };
    return (
        <div className="main-container">
            <h1 className="main-header">
                {type === "Research" ? "Research Grant Application" : "NextGen Grant Application"}
            </h1>
            <Breadcrumb currentPage={currentPage} pages={pages} />
            <h1 className="form-header">
                {pages[currentPage - 1]}
            </h1>
            {renderPage()}
            <div className="btn-container">
                <button onClick={goBack} className="back-btn">Go Back</button>
                {currentPage < totalPages ? (
                    <button onClick={handleContinue} className="save-btn">Save and Continue</button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        className={`save-btn ${!isFormValid() ? 'disabled' : ''}`}
                        disabled={!isFormValid()}
                    >
                        Save and Submit
                    </button>
                )}
            </div>
        </div>
    );
}
export default ApplicationForm;