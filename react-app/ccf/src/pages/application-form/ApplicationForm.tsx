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
import { ResearchApplication } from '../../types/application-types';
import { uploadResearchApplication } from '../../backend/applicant-form-submit';
import { toast } from 'react-toastify';
import { Modal } from '../../components/modal/modal';
import { getCurrentCycle, checkAndUpdateCycleStageIfNeeded } from '../../backend/application-cycle';
import { auth } from '../..';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../..';

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
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);
    const [appOpen, setAppOpen] = useState<boolean>(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        const savedDraft = localStorage.getItem('researchApplicationDraft');
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

            const draftRef = await addDoc(collection(db, 'applications'), {
                status: 'draft', 
                grantType: type === 'NextGen' ? 'nextgen' : 'research', 
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
        const fieldsForCurrentPage = pageFields[currentPage] || [];
        const isPageValid = fieldsForCurrentPage.every(field => {
            const value = (formData as any)[field];
            return value && value.toString().trim() !== '';
        });

        if (!isPageValid) {
            toast.warn("Please fill out all required fields. You will not be able to submit until all fields are complete.");
        }

        await saveDraft();
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
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
            setModalContent(formattedContent);
            setIsModalOpen(true);
            return;
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
            const application: ResearchApplication = formData as ResearchApplication;
            if (formData.file) {
                // Show loading toast
                toast.info('Submitting application...');

                // Call the secure cloud function
                const result = await uploadResearchApplication(application, formData.file, type === "NextGen");

                if (result.success) {
                    toast.success('Application submitted successfully!');
                    localStorage.removeItem('researchApplicationDraft');
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
export default ApplicationForm;