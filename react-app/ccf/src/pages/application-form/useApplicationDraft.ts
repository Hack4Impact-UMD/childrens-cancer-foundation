import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getCurrentCycle, checkAndUpdateCycleStageIfNeeded } from '../../backend/application-cycle';
import { auth, db } from '../..';
import { toDraftDocData } from '../../utils/draft-serialization';
import { getSubmitErrorToast } from './submit-error-messages';
import { updateApplicationSubmission } from '../../backend/applicant-form-submit';

// Draft-only/metadata fields stripped before submit. When a saved draft is
// resumed, the entire Firestore doc (including status: 'draft', cycle ids and
// timestamps) is merged into formData; sending those through would make the
// canonical submitted document still look like a draft. The file is passed
// separately and the cloud function sets the canonical storage reference.
const SUBMIT_STRIP_FIELDS = [
    'status', 'creatorId', 'applicantEmail', 'applicationCycleId',
    'applicationCycle', 'createdAt', 'lastUpdated', 'grantType',
    'decision', 'submitTime', 'applicationId', 'file', 'archived', 'editedAt'
];

/**
 * Shared draft/submit engine for the application forms. Owns the cycle poll,
 * ?draftId= resume, draft creation/saving, the cycle lock, and the submit
 * wrapper (in-flight guards, draft cleanup, error toasts). Forms keep their
 * field lists, validation, modal state, page content, and navigation.
 */
export function useApplicationDraft(options: {
    grantType: 'research' | 'nextgen' | 'nonresearch';
    formData: Record<string, any>;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}) {
    const { grantType, formData, setFormData } = options;
    const [appOpen, setAppOpen] = useState<boolean>(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    // Set when the form was opened via ?editId= to edit an already-submitted
    // application. Deliberately separate from draftId: draft saves/deletes
    // must never touch a submitted doc.
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftCycleId, setDraftCycleId] = useState<string | null>(null);
    const [draftCycle, setDraftCycle] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStartingDraft, setIsStartingDraft] = useState(false);
    const [resumedFromDraft, setResumedFromDraft] = useState(false);
    const location = useLocation();

    useEffect(() => {
        getCurrentCycle().then(async cycle => {
            const updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
            setAppOpen(updatedCycle.stage === "Applications Open")
        }).catch(error => {
            console.error('Error fetching initial cycle:', error);
        })

        // Refetch cycle every 30 seconds to detect admin changes or deadline progression
        let refreshInFlight = false;
        const cycleRefreshInterval = setInterval(async () => {
            if (refreshInFlight) return;
            refreshInFlight = true;
            try {
                const cycle = await getCurrentCycle();
                const updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
                setAppOpen(updatedCycle.stage === "Applications Open");
            } catch (error) {
                console.error('Error refetching cycle:', error);
            } finally {
                refreshInFlight = false;
            }
        }, 30000);

        return () => clearInterval(cycleRefreshInterval);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const existingDraftId = params.get('draftId');
        const existingEditId = params.get('editId');
        if (!existingDraftId && !existingEditId) return;

        const loadDraft = async () => {
            try {
                const draftDoc = await getDoc(doc(db, 'applications', existingDraftId!));
                if (draftDoc.exists()) {
                    const data = draftDoc.data();
                    if (data.status !== 'draft') {
                        toast.error('This application has already been submitted.');
                        return;
                    }
                    setDraftId(existingDraftId);
                    setDraftCycleId(data.applicationCycleId ?? null);
                    setDraftCycle(data.applicationCycle ?? null);
                    setFormData((prev: any) => ({ ...prev, ...data }));
                    setResumedFromDraft(true);
                }
            } catch (err) {
                console.error('Error loading draft:', err);
                toast.error('Failed to load saved application.');
            }
        };

        // Editing an already-submitted application: load it into the form but
        // track it as editingId, never draftId (see the state comment above).
        const loadSubmitted = async () => {
            try {
                const appDoc = await getDoc(doc(db, 'applications', existingEditId!));
                if (appDoc.exists()) {
                    const data = appDoc.data();
                    if (data.status !== 'submitted') {
                        toast.error('This application cannot be edited.');
                        return;
                    }
                    setEditingId(existingEditId);
                    setDraftCycleId(data.applicationCycleId ?? null);
                    setDraftCycle(data.applicationCycle ?? null);
                    setFormData((prev: any) => ({ ...prev, ...data }));
                    setResumedFromDraft(true);
                }
            } catch (err) {
                console.error('Error loading submitted application:', err);
                toast.error('Failed to load submitted application.');
            }
        };

        if (existingEditId) {
            loadSubmitted();
        } else {
            loadDraft();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // Creates the draft doc. Returns true when the caller may advance past the
    // first page (draft already exists, or was just created).
    const startDraft = async (): Promise<boolean> => {
        if (editingId) {
            // editing a submitted application — never fork a new draft
            return true;
        }
        if (draftId) {
            // already have a draft, just advance
            return true;
        }
        if (isStartingDraft) return false;
        setIsStartingDraft(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error('You must be logged in to start an application.');
                return false;
            }

            // Stamp the draft with the cycle it was created in so it can only
            // be submitted during that same cycle.
            const cycle = await getCurrentCycle();

            const draftRef = await addDoc(collection(db, 'applications'), {
                status: 'draft',
                grantType,
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
            return true;
        } catch (err) {
            console.error('Error creating draft:', err);
            toast.error('Failed to start application. Please try again.');
            return false;
        } finally {
            setIsStartingDraft(false);
        }
    };

    const saveDraft = async (data: Record<string, any> = formData): Promise<boolean> => {
        // Submitted docs only change through the updateApplication callable on
        // final submit; intermediate saves are silent no-ops in edit mode.
        if (editingId) return true;
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

    // Ensure the draft is being submitted during the same cycle it was created in.
    const verifyDraftCycle = async (): Promise<{ ok: boolean; modalTitle?: string; modalContent?: string }> => {
        if (!draftCycleId) return { ok: true };
        try {
            const currentCycle = await getCurrentCycle();
            if (currentCycle.id !== draftCycleId) {
                return {
                    ok: false,
                    modalTitle: 'This Application Cycle Has Ended',
                    modalContent: `This application was started during the "${draftCycle}" cycle, which has since ended. Applications can only be submitted during the cycle in which they were created.\n\nPlease contact the Children's Cancer Foundation (CCF) for assistance.`,
                };
            }
            return { ok: true };
        } catch (error) {
            console.error('Error verifying application cycle:', error);
            return {
                ok: false,
                modalTitle: 'Unable to Verify Application Cycle',
                modalContent: `We couldn't verify the current application cycle. Please try again later, or contact the Children's Cancer Foundation (CCF) for assistance.`,
            };
        }
    };

    // Wraps the upload call with the in-flight guard, payload stripping, draft
    // cleanup, and error toasts. Returns true on success; caller navigates.
    // In edit mode `file` may be the stored object name (string) — meaning the
    // existing PDF is kept — instead of a freshly attached File.
    const submit = async (
        file: File | string,
        upload: (application: Record<string, any>, file: File) => Promise<{ success: boolean }>
    ): Promise<boolean> => {
        if (isSubmitting) return false;
        if (!file) return false;
        setIsSubmitting(true);
        try {
            const application = { ...formData } as any;
            SUBMIT_STRIP_FIELDS.forEach((key) => delete application[key]);

            if (editingId) {
                toast.info('Saving changes...');
                const result = await updateApplicationSubmission(
                    editingId,
                    application,
                    file instanceof File ? file : null
                );
                if (result.success) {
                    toast.success('Application updated successfully!');
                    return true;
                }
                toast.error('Failed to update application. Please try again.');
                return false;
            }

            if (!(file instanceof File)) return false;

            // Show loading toast
            toast.info('Submitting application...');

            // Call the secure cloud function
            const result = await upload(application, file);

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
                return true;
            }
            toast.error('Failed to submit application. Please try again.');
            return false;
        } catch (error: any) {
            console.error('Application submission error:', error);
            toast.error(getSubmitErrorToast(error?.message));
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        appOpen,
        draftId,
        isSubmitting,
        isStartingDraft,
        startDraft,
        saveDraft,
        verifyDraftCycle,
        submit,
        resumedFromDraft,
        isEditingSubmitted: editingId !== null,
    };
}
