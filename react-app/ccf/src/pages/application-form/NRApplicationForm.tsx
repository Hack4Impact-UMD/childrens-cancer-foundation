import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import NRInformation from './subquestions/NRInformation';
import NRNarrative from './subquestions/NRNarrative';
import ReviewApplication from './subquestions/Review';
import AboutGrant from './subquestions/AboutGrant';
import { NonResearchApplication } from '../../types/application-types';
import { uploadNonResearchApplication } from '../../backend/applicant-form-submit';
import { toast } from 'react-toastify';
import { validateEmail, validatePhoneNumber} from '../../utils/validation';
import { getCurrentCycle, checkAndUpdateCycleStageIfNeeded } from '../../backend/application-cycle';
import { Modal } from '../../components/modal/modal';
import { auth } from '../..';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../..';

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

    const [appOpen, setAppOpen] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('Please Fill Out All Missing Fields Before Submitting');
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);
    const [draftId, setDraftId] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        const savedDraft = localStorage.getItem('nonResearchApplicationDraft');
        if (savedDraft) {
            setFormData(JSON.parse(savedDraft));
        }

        getCurrentCycle().then(async cycle => {
            const updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
            setAppOpen(updatedCycle.stage === "Applications Open")
        }).catch(error => {
            console.error('Error fetching initial cycle:', error);
        })

        // Refetch cycle every 30 seconds to detect admin changes or deadline progression
        const cycleRefreshInterval = setInterval(async () => {
            try {
                const cycle = await getCurrentCycle();
                const updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
                setAppOpen(updatedCycle.stage === "Applications Open");
            } catch (error) {
                console.error('Error refetching cycle:', error);
            }
        }, 30000);

        return () => clearInterval(cycleRefreshInterval);
    }, [])

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const existingDraftId = params.get('draftId');
        if (!existingDraftId) return;

        const loadDraft = async () => {
            try {
                const draftDoc = await getDoc(doc(db, 'applications', existingDraftId));
                if (draftDoc.exists()) {
                    const data = draftDoc.data();
                    setDraftId(existingDraftId);
                    setFormData(prev => ({ ...prev, ...data }));
                    setCurrentPage(2);
                }
            } catch (err) {
                console.error('Error loading draft:', err);
                toast.error('Failed to load saved application.');
            }
        };

        loadDraft();
    }, [location.search]);

    const goBack = async () => {
        if (currentPage > 1) {
            await saveDraft();
            setCurrentPage(currentPage - 1);
        } else {
            await saveDraft();
            navigate('/applicant/dashboard');
        }
    };

    const saveAndExit = async () => {
        await saveDraft();
        toast.success('Progress saved!');
        navigate('/applicant/dashboard');
    }

    const handleStart = async () => {
        if (draftId) {
            // already have a draft, just advance
            setCurrentPage(2);
            return;
        }
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                return;
            }

            const draftRef = await addDoc(collection(db, 'applications'), {
                status: 'draft',
                grantType: 'nonresearch',
                creatorId: currentUser.uid,
                applicantEmail: currentUser.email, 
                createdAt: new Date().toISOString(), 
                lastUpdated: new Date().toISOString(), 
                ...formData
            });

            console.log('Draft created with ID:', draftRef.id);
            setDraftId(draftRef.id);
            setCurrentPage(2);
        } catch (err) {
            console.error('Error creating draft:', err);
            toast.error('Failed to start application. Please try again.');
        }
    };

    const saveDraft = async (data = formData) => {
        if (!draftId) return;
        try {
            await updateDoc(doc(db, 'applications', draftId), {
                ...data,
                status: 'draft',
                lastUpdated: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error saving draft:', err);
        }
    };

    const handleContinue = async () => {
        if (currentPage === 2) {
            const validationErrors = validateCurrentPage();
            if (validationErrors.length > 0) {
                toast.warn(`Please fix the following issues: ${validationErrors.join(', ')}`);
                return;
            }
        }
        
        await saveDraft();
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleSubmit = async () => {
        const invalidSections = getNRInvalidSections();

        if (!appOpen) {
            setModalTitle('Applications Are Closed');
            setModalContent(
                <div style={{ whiteSpace: 'pre-line' }}>You cannot submit while applications are closed.</div>
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

        try {
            const application: NonResearchApplication = formData as NonResearchApplication;
            if (formData.file) {
                toast.info('Submitting application...');

                const result = await uploadNonResearchApplication(application, formData.file);

                if (result.success) {
                    toast.success('Application submitted successfully!');
                    localStorage.removeItem('nonResearchApplicationDraft');
                    if (draftId) {
                        await updateDoc(doc(db, 'applications', draftId), {
                            status: 'submitted', 
                            lastUpdated: new Date().toISOString()
                        });
                    }
                    navigate('/applicant/dashboard');
                } else {
                    toast.error('Failed to submit application. Please try again.');
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
                <button type="button" onClick={goBack} className="back-btn">Go Back</button>
                <button type="button" onClick={saveAndExit} className="back-btn">Save and Exit</button>
                {currentPage < totalPages ? (
                    <button type="button" onClick={currentPage === 1 ? handleStart : handleContinue} className="save-btn">{currentPage === 1 ? "Start" : "Save and Continue"}</button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className={`save-btn${appOpen && isFormValid() ? '' : ' disabled'}`}
                        aria-disabled={!(appOpen && isFormValid())}
                    >
                        Save and Submit
                    </button>
                )}
            </div>
        </div>
    );
}

export default NRApplicationForm;
