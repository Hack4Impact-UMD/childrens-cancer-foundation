import { useState, useEffect } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import Information from './subquestions/Information';
import ApplicationQuestions from './subquestions/ApplicationQuestions';
import ReviewApplication from './subquestions/Review';
import GrantProposal from './subquestions/GrantProposal';
import AboutGrant from './subquestions/AboutGrant';
import { uploadResearchApplication } from '../../backend/applicant-form-submit';
import { toast } from 'react-toastify';
import { Modal } from '../../components/modal/modal';
import { useApplicationDraft } from './useApplicationDraft';
import { confirmDiscardEdits, EXIT_EDIT_BUTTON_LABEL, EXIT_EDIT_HINT } from './exit-edit-messages';

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
    const requiredFields = [
        'title', 'principalInvestigator', 'institution',
        'department', 'departmentHead', 'institutionAddress', 'institutionCityStateZip',
        'institutionPhoneNumber', 'institutionEmail', 'typesOfCancerAddressed',
        'adminOfficialName', 'adminOfficialAddress', 'adminOfficialCityStateZip',
        'adminPhoneNumber', 'adminEmail', 'includedPublishedPaper', 'creditAgreement',
        'patentApplied', 'includedFundingInfo', 'amountRequested', 'dates',
        'einNumber', 'signaturePI', 'signatureDeptHead', 'file'
    ];
    const pageFields: { [key: number]: string[] } = {
        2: ['title', 'principalInvestigator', 'institution',
            'department', 'departmentHead', 'institutionAddress', 'institutionCityStateZip',
            'institutionPhoneNumber', 'institutionEmail', 'typesOfCancerAddressed',
            'adminOfficialName', 'adminOfficialAddress', 'adminOfficialCityStateZip',
            'adminPhoneNumber', 'adminEmail'],
        3: ['includedPublishedPaper', 'creditAgreement', 'patentApplied',
            'includedFundingInfo', 'amountRequested', 'dates',
            'einNumber', 'signaturePI', 'signatureDeptHead'],
        4: ['file'],
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
    const [modalTitle, setModalTitle] = useState<string>('Please Fill Out All Missing Fields Before Submitting');
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);

    const {
        appOpen,
        isSubmitting,
        isStartingDraft,
        startDraft,
        saveDraft,
        verifyDraftCycle,
        submit,
        resumedFromDraft,
        isEditingSubmitted,
    } = useApplicationDraft({
        grantType: type === 'NextGen' ? 'nextgen' : 'research',
        formData,
        setFormData,
    });

    useEffect(() => {
        if (resumedFromDraft) setCurrentPage(2); // Skip past the About Grant page
    }, [resumedFromDraft]);

    const goBack = async () => {
        // Going back past the first page leaves the form; in edit mode that
        // discards the edits, so it needs the same confirmation as the exit
        // button rather than silently navigating away.
        if (currentPage === 1 && isEditingSubmitted && !confirmDiscardEdits()) return;
        const saved = await saveDraft();
        if (!saved) toast.error('Your latest changes could not be saved.');
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            navigate('/applicant/dashboard');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const saveAndExit = async () => {
        if (isEditingSubmitted) {
            // Edits to a submitted application only persist on final submit,
            // so leaving now throws them away — confirm before navigating.
            if (!confirmDiscardEdits()) return;
            toast.info('Your changes were discarded. The submitted application is unchanged.');
            navigate('/applicant/dashboard');
            return;
        }
        const saved = await saveDraft();
        if (saved) {
            toast.success('Progress saved!');
            navigate('/applicant/dashboard');
        } else {
            toast.error('Could not save your progress. Please try again before leaving.');
        }
    };

    const handleStart = async () => {
        const ok = await startDraft();
        if (ok) setCurrentPage(2);
    };

    const handleContinue = async () => {
        const fieldsForCurrentPage = pageFields[currentPage] || [];
        const isPageValid = fieldsForCurrentPage.every(field => {
            const value = (formData as any)[field];
            return value && value.toString().trim() !== '';
        });

        if (!isPageValid) {
            toast.warn("Please fill out all required fields. You will not be able to submit until all fields are complete.");
        }

        const saved = await saveDraft();
        if (!saved) toast.error('Your latest changes could not be saved.');
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
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

        if (!appOpen) {
            const formattedContent = (
                <div style={{ whiteSpace: 'pre-line' }}>
                    Applications Are Closed
                </div>
            );
            setModalTitle('Applications Are Closed');
            setModalContent(formattedContent);
            setIsModalOpen(true);
            return;
        }

        const cycleCheck = await verifyDraftCycle();
        if (!cycleCheck.ok) {
            setModalTitle(cycleCheck.modalTitle!);
            setModalContent(
                <div style={{ whiteSpace: 'pre-line' }}>
                    {cycleCheck.modalContent}
                </div>
            );
            setIsModalOpen(true);
            return;
        }

        if (Object.keys(invalidSections).length > 0) {
            setModalTitle('Please Fill Out All Missing Fields Before Submitting');
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

        if (!formData.file) return;
        const submitted = await submit(formData.file, (application, file) =>
            uploadResearchApplication(application as any, file, type === "NextGen"));
        if (submitted) navigate('/applicant/dashboard');
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
                return <AboutGrant type={type} formData={formData} />;
            case 2:
                return <Information formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} />;
            case 3:
                return <ApplicationQuestions formData={formData} setFormData={setFormData} />;
            case 4:
                return <GrantProposal type={type} formData={formData} setFormData={setFormData} />;
            case 5:
                return <ReviewApplication type={type} formData={formData} />;
            default:
                return null;
        }
    };
    return (
        <div className="application-form-main-container">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
            >
                {modalContent}
            </Modal>
            <h1 className="main-header">
                {type === "Research" ? "Research Grant Application" : "NextGen Grant Application"}
                {isEditingSubmitted ? " (Editing)" : ""}
            </h1>
            {isEditingSubmitted && <p className="edit-mode-hint">{EXIT_EDIT_HINT}</p>}
            <Breadcrumb currentPage={currentPage} pages={pages} />
            <h1 className="form-header">
                {pages[currentPage - 1]}
            </h1>
            {renderPage()}
            <div className="btn-container">
                <button type="button" onClick={goBack} className="app-form-btn app-form-btn-secondary">Go Back</button>
                <div className="btn-right-group">
                    <button type="button" onClick={saveAndExit} className="app-form-btn app-form-btn-secondary">
                        {isEditingSubmitted ? EXIT_EDIT_BUTTON_LABEL : 'Save and Exit'}
                    </button>
                    {currentPage < totalPages ? (
                        <button type="button" onClick={currentPage === 1 ? handleStart : handleContinue} disabled={currentPage === 1 && isStartingDraft} className="app-form-btn app-form-btn-primary">
                            {currentPage === 1 ? "Start" : "Save and Continue"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`app-form-btn app-form-btn-primary${appOpen && isFormValid() && !isSubmitting ? '' : ' disabled'}`}
                            aria-disabled={!(appOpen && isFormValid()) || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting…' : isEditingSubmitted ? 'Save Changes' : 'Save and Submit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ApplicationForm;
