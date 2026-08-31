import { httpsCallable } from 'firebase/functions';
import { functions } from '../index';
import { NonResearchApplication, ResearchApplication } from '../types/application-types';
import { FormReference } from '../types/form-template-types';
import { uploadFileToStorage } from '../storage/storage';

// New secure cloud function for application submission
export const submitApplication = async (
    application: ResearchApplication | NonResearchApplication,
    file: File,
    grantType: 'research' | 'nextgen' | 'nonresearch',
    /**
     * The published version the browser rendered, when there is one. It travels
     * beside the answers rather than inside them: the cloud function reads it
     * from the top level, and strips these keys from the answers so a client
     * cannot stamp an application with a version it was not validated against.
     */
    formReference?: FormReference
): Promise<{ success: boolean; applicationId: string; message: string }> => {
    try {
        // Client-side pre-checks throw the same message shapes the forms already map:
        if (file.type !== 'application/pdf') throw new Error('Only PDF files are allowed');
        if (file.size > 50 * 1024 * 1024) throw new Error('File size exceeds 50MB limit');

        // Upload straight to Storage (rules enforce type/size server-side too),
        // then hand the object name to the callable. This avoids base64-encoding
        // the PDF through the callable's 32MB request limit.
        const storedFileName = await uploadFileToStorage(file);

        const submitAppFunction = httpsCallable(functions, 'submitApplication');
        const result = await submitAppFunction({
            application,
            grantType,
            storedFileName,
            originalFileName: file.name,
            ...(formReference ?? {}),
        });

        return result.data as { success: boolean; applicationId: string; message: string };
    } catch (error: any) {
        console.error("Error submitting application:", error);

        // Handle specific Firebase function errors
        if (error.code) {
            throw new Error(error.message || 'Application submission failed');
        }

        throw error;
    }
};

// Legacy function for research applications (redirects to new secure function)
export const uploadResearchApplication = async (
    application: ResearchApplication,
    file: File,
    nextGen: boolean,
    formReference?: FormReference
): Promise<{ success: boolean; applicationId: string; message: string }> => {
    const grantType = nextGen ? 'nextgen' : 'research';
    return await submitApplication(application, file, grantType, formReference);
};

// Legacy function for non-research applications (redirects to new secure function)
export const uploadNonResearchApplication = async (
    application: NonResearchApplication,
    file: File,
    formReference?: FormReference
): Promise<{ success: boolean; applicationId: string; message: string }> => {
    return await submitApplication(application, file, 'nonresearch', formReference);
};
