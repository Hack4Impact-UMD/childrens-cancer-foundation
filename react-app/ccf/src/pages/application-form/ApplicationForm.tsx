import { useState } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import Information from './subquestions/Information';
import ApplicationQuestions from './subquestions/ApplicationQuestions';
import ReviewApplication from './subquestions/Review';
import GrantProposal from './subquestions/GrantProposal';
import AboutGrant from './subquestions/AboutGrant';
import { ResearchApplication } from '../../types/application-types';
import { uploadResearchApplication } from '../../backend/applicant-form-submit';
import { validateEmail, validatePhoneNumber } from '../../utils/validation';

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
    const [errors, setErrors] = useState<any>({});
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
        if (!isFormValid(true)) {
            alert("Please fill all required fields and correct the errors before submitting.");
            return;
        }
        try {
            const application: ResearchApplication = formData as ResearchApplication
            if (formData.file)
                uploadResearchApplication(application, formData.file, type == "NextGen")
        } catch (e) {
            console.log(e)
        }

        navigate('/applicant/dashboard')
    };
    const isFormValid = (checkAll = false) => {
        const hasRequiredFields = requiredFields.reduce((acc, curr) => {
            const value = (formData as any)[curr];
            const result = value !== '' && value !== null;
            if (checkAll && !result) {
                setErrors((prev: any) => ({ ...prev, [curr]: "This field cannot be empty." }));
            }
            return acc && result;
        }, true);
        const hasNoErrors = Object.values(errors).every(error => error === null || error === '' || error === undefined);
        return hasRequiredFields && hasNoErrors;
    };
    const renderPage = () => {
        switch (currentPage) {
            case 1:
                return <GrantProposal type={type} formData={formData} setFormData={setFormData} />;
            case 2:
                return <AboutGrant type={type} formData={formData} />;
            case 3:
                return <Information formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} />;
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