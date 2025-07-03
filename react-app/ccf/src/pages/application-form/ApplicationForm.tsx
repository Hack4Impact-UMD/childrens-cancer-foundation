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
import { toast } from 'react-toastify';
import { Modal } from '../../components/modal/modal';

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
        'title', 'principalInvestigator', 'otherStaff', 'coPI', 'institution', 
        'department', 'departmentHead', 'institutionAddress', 'institutionCityStateZip', 
        'institutionPhoneNumber', 'institutionEmail', 'typesOfCancerAddressed', 
        'adminOfficialName', 'adminOfficialAddress', 'adminOfficialCityStateZip', 
        'adminPhoneNumber', 'adminEmail', 'includedPublishedPaper', 'creditAgreement', 
        'patentApplied', 'includedFundingInfo', 'amountRequested', 'dates', 'continuation', 
        'continuationYears', 'einNumber', 'attestationHumanSubjects', 'attestationCertification', 
        'signaturePI', 'signatureDeptHead', 'file'
    ];
    const pageFields: { [key: number]: string[] } = {
        1: ['file'],
        3: ['title', 'principalInvestigator', 'otherStaff', 'coPI', 'institution', 
            'department', 'departmentHead', 'institutionAddress', 'institutionCityStateZip', 
            'institutionPhoneNumber', 'institutionEmail', 'typesOfCancerAddressed', 
            'adminOfficialName', 'adminOfficialAddress', 'adminOfficialCityStateZip', 
            'adminPhoneNumber', 'adminEmail', 'einNumber'],
        4: ['includedPublishedPaper', 'creditAgreement', 'patentApplied', 
            'includedFundingInfo', 'amountRequested', 'dates', 'continuation', 
            'continuationYears', 'attestationHumanSubjects', 'attestationCertification', 
            'signaturePI', 'signatureDeptHead'],
    };
    const [formData, setFormData] = useState({
        title: '',
        principalInvestigator: '',
        otherStaff: '',
        coPI: false,
        institution: '',
        department: '',
        departmentHead: '',
        institutionAddress: '',
        institutionCityStateZip: '',
        institutionPhoneNumber: '',
        institutionEmail: '',
        typesOfCancerAddressed: '',
        adminOfficialName: '',
        adminOfficialAddress: '',
        adminOfficialCityStateZip: '',
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
        einNumber: '',
        attestationHumanSubjects: false,
        attestationCertification: false,
        signaturePI: '',
        signatureDeptHead: '',
        file: null
    });
    const [errors, setErrors] = useState<any>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);
    const goBack = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            navigate('/applicant/dashboard');
        }
    };
    const handleContinue = () => {
        const fieldsForCurrentPage = pageFields[currentPage] || [];
        const isPageValid = fieldsForCurrentPage.every(field => {
            const value = (formData as any)[field];
            return value && value.toString().trim() !== '';
        });

        if (!isPageValid) {
            toast.warn("Please fill out all required fields. You will not be able to submit until all fields are complete.");
        }
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
    const handleSubmit = () => {
        const invalidSections: { [key: string]: string[] } = {};

        // Check required fields page by page
        for (const pageNum in pageFields) {
            const pageIndex = parseInt(pageNum) - 1;
            if (pageIndex < 0 || pageIndex >= pages.length) continue;

            const pageName = pages[pageIndex];
            const fieldsOnPage = pageFields[parseInt(pageNum)];
            const invalidFieldsOnPage = [];

            for (const field of fieldsOnPage) {
                const value = (formData as any)[field];
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    const fieldName = field === 'file' ? 'PDF Upload' : field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                    invalidFieldsOnPage.push(fieldName);
                }
            }

            if (invalidFieldsOnPage.length > 0) {
                invalidSections[pageName] = invalidFieldsOnPage;
            }
        }

        // Check for validation errors from the 'errors' state
        const validationErrors = Object.entries(errors)
            .filter(([, value]) => value)
            .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()));

        if (validationErrors.length > 0) {
            if (!invalidSections["My Information"]) {
                invalidSections["My Information"] = [];
            }
            validationErrors.forEach(fieldName => {
                if (!invalidSections["My Information"].includes(fieldName)) {
                    invalidSections["My Information"].push(`${fieldName} (Invalid format)`);
                }
            });
        }

        if (Object.keys(invalidSections).length > 0) {
            const formattedContent = (
                <div style={{ whiteSpace: 'pre-line' }}>
                    {Object.entries(invalidSections).map(([section, fields]) => (
                        <div key={section} style={{ marginBottom: '10px' }}>
                            <strong>{section}</strong>
                            {fields.map(f => `\n- ${f}`).join('')}
                        </div>
                    ))}
                </div>
            );
            setModalContent(formattedContent);
            setIsModalOpen(true);
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
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Please Fill Out All Missing Fields Before Submitting"
            >
                {modalContent}
            </Modal>
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
                        className={`save-btn ${!isFormValid() ? 'warning' : ''}`}
                    >
                        Save and Submit
                    </button>
                )}
            </div>
        </div>
    );
}
export default ApplicationForm;