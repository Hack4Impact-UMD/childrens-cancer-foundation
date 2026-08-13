import { useEffect, useState } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import NRInformation from './subquestions/NRInformation';
import NRNarrative from './subquestions/NRNarrative';
import ReviewApplication from './subquestions/Review';
import AboutGrant from './subquestions/AboutGrant';
import { uploadNonResearchApplication } from '../../backend/applicant-form-submit';
import { toast } from 'react-toastify';
import { validateEmail, validatePhoneNumber } from '../../utils/validation';
import { Modal } from '../../components/modal/modal';
import { useApplicationDraft } from './useApplicationDraft';

function NRApplicationForm(): JSX.Element {
    const [currentPage, setCurrentPage] = useState(1);
    const pages = ["About Grant", "My Information", "Narrative", "Review"];
    const totalPages = pages.length;
    const navigate = useNavigate();

    const myInformationFields = [
        'title', 'requestor', 'institution', 'institutionPhoneNumber', 'institutionEmail',
        'amountRequested', 'timeframe'
    ];

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('Please Fill Out All Missing Fields Before Submitting');
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
    } = useApplicationDraft({
        grantType: 'nonresearch',
        formData,
        setFormData,
    });

    useEffect(() => {
        if (resumedFromDraft) setCurrentPage(2);
    }, [resumedFromDraft]);

    const goBack = async () => {
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
        const saved = await saveDraft();
        if (saved) {
            toast.success('Progress saved!');
            navigate('/applicant/dashboard');
        } else {
            toast.error('Could not save your progress. Please try again before leaving.');
        }
    }

    const handleStart = async () => {
        const ok = await startDraft();
        if (ok) setCurrentPage(2);
    };

    const handleContinue = async () => {
        if (currentPage === 2) {
            const validationErrors = validateCurrentPage();
            if (validationErrors.length > 0) {
                toast.warn(`Please fix the following issues: ${validationErrors.join(', ')}`);
                return;
            }
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
        const invalidSections = getNRInvalidSections();

        if (!appOpen) {
            setModalTitle('Applications Are Closed');
            setModalContent(
                <div style={{ whiteSpace: 'pre-line' }}>You cannot submit while applications are closed.</div>
            );
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
                            {fields.map((f) => `\n- ${f}`).join('')}
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
            uploadNonResearchApplication(application as any, file));
        if (submitted) navigate('/applicant/dashboard');
    };

    const getNRInvalidSections = (): Record<string, string[]> => {
        const invalidSections: Record<string, string[]> = {};

        const push = (section: string, message: string) => {
            if (!invalidSections[section]) invalidSections[section] = [];
            invalidSections[section].push(message);
        };

        for (const field of myInformationFields) {
            const value = (formData as any)[field];
            if (!value || value.toString().trim() === '') {
                push('My Information', `${getFieldDisplayName(field)} is required`);
            }
        }

        const fileVal = formData.file;
        if (!fileVal) {
            push('Narrative', `${getFieldDisplayName('file')} is required`);
        }

        if (formData.institutionEmail?.trim()) {
            const emailError = validateEmail(formData.institutionEmail);
            if (emailError) {
                push('My Information', 'Invalid email format');
            }
        }

        if (formData.institutionPhoneNumber?.trim()) {
            const phoneError = validatePhoneNumber(formData.institutionPhoneNumber);
            if (phoneError) {
                push('My Information', phoneError);
            }
        }

        if (formData.amountRequested?.trim()) {
            const amount = parseFloat(formData.amountRequested);
            if (isNaN(amount) || amount <= 0) {
                push('My Information', 'Amount requested must be a valid positive number');
            }
        }

        return invalidSections;
    };

    const validateCurrentPage = (): string[] => {
        const sections = getNRInvalidSections();
        return Object.values(sections).flat();
    };

    const getFieldDisplayName = (field: string): string => {
        const fieldNames: { [key: string]: string } = {
            'title': 'Title',
            'requestor': 'Principal Requestor',
            'institution': 'Institution',
            'institutionPhoneNumber': 'Phone Number',
            'institutionEmail': 'Email',
            'amountRequested': 'Amount Requested',
            'timeframe': 'Timeframe',
            'file': 'File'
        };
        return fieldNames[field] || field;
    };

    const isFormValid = (): boolean => {
        const errors = validateCurrentPage();
        return errors.length === 0;
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
        <div className="application-form-main-container">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
            >
                {modalContent}
            </Modal>
            <h1 className="main-header">Non-Research Grant</h1>
            <Breadcrumb currentPage={currentPage} pages={pages} />

            <h1 className="form-header">{pages[currentPage - 1]}</h1>
            {renderPage()}

            <div className="btn-container">
                <button type="button" onClick={goBack} className="app-form-btn app-form-btn-secondary">Go Back</button>
                <div className="btn-right-group">
                    <button type="button" onClick={saveAndExit} className="app-form-btn app-form-btn-secondary">Save and Exit</button>
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
                            {isSubmitting ? 'Submitting…' : 'Save and Submit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NRApplicationForm;
