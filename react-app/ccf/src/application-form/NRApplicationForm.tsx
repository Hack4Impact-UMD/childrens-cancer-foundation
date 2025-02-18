import { useState } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import NRInformation from './subquestions/NRInformation';
import NRNarrative from './subquestions/NRNarrative';
import Review from './subquestions/Review';
import AboutGrant from './subquestions/AboutGrant';

function NRApplicationForm(): JSX.Element {
    const [currentPage, setCurrentPage] = useState(1);
    const pages = ["About Grant", "My Information", "Narrative", "Review"];
    const totalPages = pages.length;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        projectTitle: '',
        requester: '',
        institution: '',
        institutionPhone: '',
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
            navigate('/applicant-dashboard');
        }
    };

    const handleContinue = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleSubmit = () => {
        console.log('Form submitted!');
    };

    // Validation function to check if all fields are filled
    const isFormValid = () => {
        return Object.values(formData).every(field => field !== '' && field !== null);
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
                return <Review type={"NonResearch"} formData={formData} />;
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
