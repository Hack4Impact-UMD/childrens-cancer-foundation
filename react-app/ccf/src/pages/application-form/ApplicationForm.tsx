import { useState } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import Information from './subquestions/Information';
import ApplicationQuestions from './subquestions/ApplicationQuestions';
import Review from './subquestions/Review';
import GrantProposal from './subquestions/GrantProposal';
import AboutGrant from './subquestions/AboutGrant';
type ApplicationFormProps = {
    type: "Research" | "NextGen";
};
function ApplicationForm({ type }: ApplicationFormProps): JSX.Element {
    const [currentPage, setCurrentPage] = useState(1);
    const pages = type === "Research"
        ? ["About Grant", "My Information", "Application Questions", "Grant Proposal", "Review"]
        : ["About Grant", "My Information", "Application Questions", "Grant Proposal", "Review"];
    const totalPages = pages.length;
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        projectTitle: '',
        investigator: '',
        cancers: '',
        institution: '',
        institutionAddress: '',
        institutionPhone: '',
        institutionEmail: '',
        adminName: '',
        adminAddress: '',
        adminPhone: '',
        adminEmail: '',
        published: '',
        paperWIP: '',
        appliedPatent: '',
        includedInfo: '',
        amountRequested: '',
        grantProjDates: '',
        contCurrentFunds: '',
        contCurrentFundsDates: '',
        file: null
    });
    const goBack = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            navigate('/applicant-dashboard');
        }
    };
    const handleContinue = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
    const handleSubmit = () => {
        console.log('Form submitted!');
    };
    // Validation function to check if all required fields are filled
    const isFormValid = () => {
        return Object.values(formData).every(field => field !== '' && field !== null);
    };
    const renderPage = () => {
        switch (currentPage) {
            case 1:
                return <AboutGrant type={type} formData={formData} />;
            case 2:
                return <Information formData={formData} setFormData={setFormData} />;
            case 3:
                return <ApplicationQuestions formData={formData} setFormData={setFormData} />;
            case 4:
                return <GrantProposal type={type} />;
            case 5:
                return <Review type={type} formData={formData} />;
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