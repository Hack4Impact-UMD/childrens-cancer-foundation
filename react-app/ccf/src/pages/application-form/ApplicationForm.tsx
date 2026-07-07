import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { getCurrentCycle, checkAndUpdateCycleStageIfNeeded } from '../../backend/application-cycle';
import { auth } from '../..';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../..';
import { toDraftDocData } from '../../utils/draft-serialization';

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
    const [appOpen, setAppOpen] = useState<boolean>(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [draftCycleId, setDraftCycleId] = useState<string | null>(null);
    const [draftCycle, setDraftCycle] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
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
                    setDraftCycleId(data.applicationCycleId ?? null);
                    setDraftCycle(data.applicationCycle ?? null);
                    setFormData(prev => ({ ...prev, ...data }));
                    setCurrentPage(2); // Skip past the About Grant page
                }
            } catch (err) {
                console.error('Error loading draft:', err);
                toast.error('Failed to load saved application.');
            }
        };

        loadDraft();
    }, [location.search]);

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
    };

    const handleStart = async () => {
        if (draftId) {
            // already have a draft, just advance
            setCurrentPage(2);
            return;
        }
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error('You must be logged in to start an application.');
                return;
            }

            // Stamp the draft with the cycle it was created in so it can only
            // be submitted during that same cycle.
            const cycle = await getCurrentCycle();

            const draftRef = await addDoc(collection(db, 'applications'), {
                status: 'draft',
                grantType: type === 'NextGen' ? 'nextgen' : 'research',
                creatorId: currentUser.uid,
                applicantEmail: currentUser.email,
                applicationCycleId: cycle.id,
                applicationCycle: cycle.name,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                ...toDraftDocData(formData)
            });

            console.log('Draft created with ID:', draftRef.id);
            setDraftId(draftRef.id);
            setDraftCycleId(cycle.id);
            setDraftCycle(cycle.name);
            setCurrentPage(2);
        } catch (err) {
            console.error('Error creating draft:', err);
            toast.error('Failed to start application. Please try again.');
        }
    };

    const saveDraft = async (data = formData): Promise<boolean> => {
        if (!draftId) return true; // nothing to save yet (page 1, no draft created)
        try {
            await updateDoc(doc(db, 'applications', draftId), {
                ...toDraftDocData(data),
                status: 'draft',
                lastUpdated: new Date().toISOString()
            });
            return true;
        } catch (err) {
            console.error('Error saving draft:', err);
            return false;
        }
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

        // Ensure the draft is being submitted during the same cycle it was created in.
        if (draftCycleId) {
            try {
                const currentCycle = await getCurrentCycle();
                if (currentCycle.id !== draftCycleId) {
                    setModalTitle('This Application Cycle Has Ended');
                    setModalContent(
                        <div style={{ whiteSpace: 'pre-line' }}>
                            {`This application was started during the "${draftCycle}" cycle, which has since ended. Applications can only be submitted during the cycle in which they were created.\n\nPlease contact the Children's Cancer Foundation (CCF) for assistance.`}
                        </div>
                    );
                    setIsModalOpen(true);
                    return;
                }
            } catch (error) {
                console.error('Error verifying application cycle:', error);
                setModalTitle('Unable to Verify Application Cycle');
                setModalContent(
                    <div style={{ whiteSpace: 'pre-line' }}>
                        {`We couldn't verify the current application cycle. Please try again later, or contact the Children's Cancer Foundation (CCF) for assistance.`}
                    </div>
                );
                setIsModalOpen(true);
                return;
            }
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

        try {
            // Strip draft-only/metadata fields so the submitted application is never
            // tagged as a draft. When a saved draft is resumed, the entire Firestore
            // doc (including status: 'draft', cycle ids and timestamps) is merged into
            // formData; sending those through would make the canonical submitted
            // document still look like a draft. The file is passed separately and the
            // cloud function sets the canonical storage reference.
            const application = { ...formData } as any;
            [
                'status', 'creatorId', 'applicantEmail', 'applicationCycleId',
                'applicationCycle', 'createdAt', 'lastUpdated', 'grantType',
                'decision', 'submitTime', 'applicationId', 'file'
            ].forEach((key) => delete application[key]);
            if (formData.file) {
                // Show loading toast
                toast.info('Submitting application...');

                // Call the secure cloud function
                const result = await uploadResearchApplication(application, formData.file, type === "NextGen");

                if (result.success) {
                    toast.success('Application submitted successfully!');
                    // The cloud function creates the canonical submitted application,
                    // so remove the working draft to avoid a duplicate appearing.
                    if (draftId) {
                        try {
                            await deleteDoc(doc(db, 'applications', draftId));
                        } catch (cleanupErr) {
                            console.error('Failed to delete draft after submission:', cleanupErr);
                        }
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
            </h1>
            <Breadcrumb currentPage={currentPage} pages={pages} />
            <h1 className="form-header">
                {pages[currentPage - 1]}
            </h1>
            {renderPage()}
            <div className="btn-container">
                <button type="button" onClick={goBack} className="app-form-btn app-form-btn-secondary">Go Back</button>
                <div className="btn-right-group">
                    <button type="button" onClick={saveAndExit} className="app-form-btn app-form-btn-secondary">Save and Exit</button>
                    {currentPage < totalPages ? (
                        <button type="button" onClick={currentPage === 1 ? handleStart : handleContinue} className="app-form-btn app-form-btn-primary">
                            {currentPage === 1 ? "Start" : "Save and Continue"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className={`app-form-btn app-form-btn-primary${appOpen && isFormValid() ? '' : ' disabled'}`}
                            aria-disabled={!(appOpen && isFormValid())}
                        >
                            Save and Submit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ApplicationForm;