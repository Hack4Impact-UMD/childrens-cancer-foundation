import { useEffect, useState } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import NRInformation from './subquestions/NRInformation';
import NRNarrative from './subquestions/NRNarrative';
import ReviewApplication from './subquestions/Review';
import AboutGrant from './subquestions/AboutGrant';
import { NonResearchApplication } from '../../types/application-types';
import { uploadNonResearchApplication } from '../../backend/applicant-form-submit';
import { getCurrentCycle } from '../../backend/application-cycle';
import { toast } from 'react-toastify';

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

    const [appOpen, setAppOpen] = useState<boolean>(false);

    useEffect(() => {
        getCurrentCycle().then(cycle => {
            setAppOpen(cycle.stage == "Applications Open")
        })
    }, [])

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

    const handleSubmit = async () => {
        try {
            if (isFormValid() && appOpen) {
                const application: NonResearchApplication = formData as NonResearchApplication;
                if (formData.file) {
                    // Show loading toast
                    toast.info('Submitting application...');

                    // Call the secure cloud function
                    const result = await uploadNonResearchApplication(application, formData.file);

                    if (result.success) {
                        toast.success('Application submitted successfully!');
                        navigate('/applicant/dashboard');
                    } else {
                        toast.error('Failed to submit application. Please try again.');
                    }
                }
            }
        } catch (error: any) {
            console.error('Application submission error:', error);

            // Handle specific error messages from the cloud function
            if (error.message) {
                if (error.message.includes('Applications are currently closed')) {
                    toast.error('Applications are currently closed. Please check back later.');
                } else if (error.message.includes('already submitted')) {
                    toast.error('You have already submitted an application for this grant type.');
                } else if (error.message.includes('Deadline')) {
                    toast.error('The deadline for this application type has passed.');
                } else if (error.message.includes('Only PDF files')) {
                    toast.error('Please upload a PDF file.');
                } else if (error.message.includes('size exceeds')) {
                    toast.error('File size exceeds 50MB limit. Please upload a smaller file.');
                } else if (error.message.includes('Invalid application data')) {
                    toast.error('Please check your application data and try again.');
                } else {
                    toast.error(error.message);
                }
            } else {
                toast.error('Failed to submit application. Please try again.');
            }
        }
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
                        className={`save-btn ${appOpen ? (!isFormValid() ? 'warning' : '') : 'disabled'}`}
                        disabled={!appOpen && !isFormValid()}
                    >
                        Save and Submit
                    </button>
                )}
            </div>
        </div>
    );
}

export default NRApplicationForm;
