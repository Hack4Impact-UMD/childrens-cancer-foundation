import { useState } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import NRInformation from './subquestions/NRInformation';
import NRNarrative from './subquestions/NRNarrative';
import ReviewApplication from './subquestions/Review';
import AboutGrant from './subquestions/AboutGrant';
import { NonResearchApplication } from '../../types/application-types';
import { uploadNonResearchApplication } from '../../backend/applicant-form-submit';

function NRApplicationForm(): JSX.Element {
    const [currentPage, setCurrentPage] = useState(1);
    const pages = ["About Grant", "My Information", "Narrative", "Review"];
    const totalPages = pages.length;
    const navigate = useNavigate();

    const requiredFields = [
        'title', 'requestor', 'institution', 'institutionPhoneNumber', 'institutionEmail',
        'amountRequested', 'timeframe', 'file'
    ]

    const [formData, setFormData] = useState({
        title: '',
        requestor: '',
        institution: '',
        institutionPhoneNumber: '',
        institutionEmail: '',
        explanation: '',
        sources: '',
        amountRequested: '',
        timeframe: '',
        additionalInfo: '',
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
            const application: NonResearchApplication = formData as NonResearchApplication
            if (formData.file) {
                uploadNonResearchApplication(application, formData.file)
            }
        } catch (e) {
            console.log(e)
        }

        navigate('/applicant/dashboard')
    };

    // Validation function to check if all fields are filled
    const isFormValid = () => {
        return requiredFields.reduce((acc, curr) => (formData as any)[curr] !== '' && (formData as any)[curr] !== null && acc, true);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 1:
                return <AboutGrant type={"NonResearch"} formData={formData} />;
            case 2:
                return <NRInformation formData={formData} setFormData={setFormData} />;
            case 3:
                return <NRNarrative formData={formData} setFormData={setFormData} />;
            case 4:
                return <ReviewApplication type={"NonResearch"} formData={formData} />;
            default:
                return null;
        }
    };

    return (
        <div className="main-container">
            <h1 className="main-header">Non-Research Grant</h1>
            <Breadcrumb currentPage={currentPage} pages={pages} />

            <h1 className="form-header">{pages[currentPage - 1]}</h1>
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

export default NRApplicationForm;
