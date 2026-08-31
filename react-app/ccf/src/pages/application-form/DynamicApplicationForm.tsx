import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import AboutGrant from './subquestions/AboutGrant';
import DynamicFormPage from '../../components/dynamic-forms/DynamicFormPage';
import DynamicReview from '../../components/dynamic-forms/DynamicReview';
import { Modal } from '../../components/modal/modal';
import { useApplicationDraft } from './useApplicationDraft';
import { getActiveTemplate } from '../../backend/form-template-service';
import {
    getProblemsByPage,
    getVisiblePages,
    validateAnswers,
} from '../../form-templates/engine';
import { getSeedTemplate } from '../../form-templates/seed';
import {
    uploadNonResearchApplication,
    uploadResearchApplication,
} from '../../backend/applicant-form-submit';
import { ApplicationAboutType } from '../../types/aboutTypes';
import { Answers, FormTemplate, GrantType } from '../../types/form-template-types';

type DynamicApplicationFormProps = {
    grantType: GrantType;
};

const ABOUT_TYPE: Record<GrantType, ApplicationAboutType> = {
    research: 'Research',
    nextgen: 'NextGen',
    nonresearch: 'NonResearch',
};

/**
 * The application form, rendered from a template.
 *
 * This replaces the three hand-written forms. What an applicant is asked, in
 * what order, with which questions required, now comes from the published
 * template — and from the same engine the cloud function validates with, so
 * the two cannot disagree.
 *
 * Everything around the questions is unchanged: drafts, the cycle lock, the
 * save/submit flow and the cloud function all work exactly as they did.
 */
function DynamicApplicationForm({ grantType }: DynamicApplicationFormProps): JSX.Element {
    const navigate = useNavigate();

    // Start from the seed so the form renders instantly and still works if
    // Firestore is unreachable; the published template replaces it on load.
    const [template, setTemplate] = useState<FormTemplate>(() => getSeedTemplate(grantType));
    const [pageIndex, setPageIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
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
    } = useApplicationDraft({ grantType, formData: answers, setFormData: setAnswers });

    useEffect(() => {
        let active = true;
        getActiveTemplate(grantType)
            .then((found) => { if (active) setTemplate(found); })
            .catch((error) => console.error('Error loading form template:', error));
        return () => { active = false; };
    }, [grantType]);

    // Pages the applicant's own answers make visible. Navigation is by page
    // ID, never by index, because a template can gain or reorder pages.
    const pages = useMemo(() => getVisiblePages(template, answers), [template, answers]);
    const page = pages[Math.min(pageIndex, pages.length - 1)];
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex >= pages.length - 1;

    useEffect(() => {
        // A resumed draft skips the About page, as it always has.
        if (resumedFromDraft) setPageIndex(1);
    }, [resumedFromDraft]);

    const setAnswer = (fieldId: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [fieldId]: value }));
        setErrors((prev) => {
            if (!prev[fieldId]) return prev;
            const next = { ...prev };
            delete next[fieldId];
            return next;
        });
    };

    const goToPage = (index: number) => {
        setPageIndex(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = async () => {
        const saved = await saveDraft();
        if (!saved) toast.error('Your latest changes could not be saved.');
        if (pageIndex > 0) {
            goToPage(pageIndex - 1);
        } else {
            navigate('/applicant/dashboard');
        }
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
        const ok = await startDraft();
        if (ok) goToPage(1);
    };

    const handleContinue = async () => {
        // Only this page's questions are checked, so an applicant is never
        // blocked by something they have not been shown yet.
        const pageErrors = validateAnswers(template, answers, [page.id]);
        setErrors(pageErrors);
        if (Object.keys(pageErrors).length > 0) {
            toast.warn(`Please fix the following issues: ${Object.values(pageErrors).join(', ')}`);
            return;
        }

        const saved = await saveDraft();
        if (!saved) toast.error('Your latest changes could not be saved.');
        if (!isLastPage) goToPage(pageIndex + 1);
    };

    const showModal = (title: string, content: React.ReactNode) => {
        setModalTitle(title);
        setModalContent(content);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!appOpen) {
            showModal('Applications Are Closed', (
                <div style={{ whiteSpace: 'pre-line' }}>You cannot submit while applications are closed.</div>
            ));
            return;
        }

        const cycleCheck = await verifyDraftCycle();
        if (!cycleCheck.ok) {
            showModal(cycleCheck.modalTitle!, (
                <div style={{ whiteSpace: 'pre-line' }}>{cycleCheck.modalContent}</div>
            ));
            return;
        }

        const problems = getProblemsByPage(template, answers);
        if (Object.keys(problems).length > 0) {
            setErrors(validateAnswers(template, answers));
            showModal('Please Fill Out All Missing Fields Before Submitting', (
                <div style={{ whiteSpace: 'pre-line' }}>
                    {Object.entries(problems).map(([section, messages]) => (
                        <div key={section} style={{ marginBottom: '10px' }}>
                            <strong>{section}</strong>
                            {messages.map((m) => `\n- ${m}`).join('')}
                        </div>
                    ))}
                </div>
            ));
            return;
        }

        const file = answers.file as File | null;
        if (!file) return;

        // The application records the exact form it was filled in against, so
        // the cloud function re-reads that version and validates with it. The
        // in-code fallback has no stored version to point at, so it references
        // none and the server falls back to the pre-builder field checks.
        const formReference = template.isFallback
            ? undefined
            : { formTemplateId: template.id, formVersion: template.version };

        const submitted = await submit(file, (application, uploaded, reference) =>
            grantType === 'nonresearch'
                ? uploadNonResearchApplication(application as any, uploaded, reference)
                : uploadResearchApplication(application as any, uploaded, grantType === 'nextgen', reference),
            formReference
        );
        if (submitted) navigate('/applicant/dashboard');
    };

    const isFormValid = Object.keys(validateAnswers(template, answers)).length === 0;

    const renderPage = () => {
        if (!page) return null;
        switch (page.kind) {
            case 'about':
                return <AboutGrant type={ABOUT_TYPE[grantType]} formData={answers as any} />;
            case 'review':
                return <DynamicReview form={template} answers={answers} />;
            default:
                return (
                    <DynamicFormPage
                        page={page}
                        answers={answers}
                        errors={errors}
                        onChange={setAnswer}
                    />
                );
        }
    };

    return (
        <div className="application-form-main-container">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
                {modalContent}
            </Modal>

            <h1 className="main-header">{template.name}</h1>
            <Breadcrumb currentPage={pageIndex + 1} pages={pages.map((p) => p.title)} />
            <h1 className="form-header">{page?.title}</h1>

            {renderPage()}

            <div className="btn-container">
                <button type="button" onClick={goBack} className="app-form-btn app-form-btn-secondary">Go Back</button>
                <div className="btn-right-group">
                    <button type="button" onClick={saveAndExit} className="app-form-btn app-form-btn-secondary">
                        Save and Exit
                    </button>
                    {!isLastPage ? (
                        <button
                            type="button"
                            onClick={isFirstPage ? handleStart : handleContinue}
                            disabled={isFirstPage && isStartingDraft}
                            className="app-form-btn app-form-btn-primary"
                        >
                            {isFirstPage ? 'Start' : 'Save and Continue'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`app-form-btn app-form-btn-primary${appOpen && isFormValid && !isSubmitting ? '' : ' disabled'}`}
                            aria-disabled={!(appOpen && isFormValid) || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting…' : 'Save and Submit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DynamicApplicationForm;
