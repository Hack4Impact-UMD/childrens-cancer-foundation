import { httpsCallable } from 'firebase/functions';
import { functions } from '../index';
import { ApplicationDetails, NonResearchApplication, ResearchApplication } from '../types/application-types';

// Helper function to convert file to base64 using browser-compatible API
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = result.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// New secure cloud function for application submission
export const submitApplication = async (
    application: ResearchApplication | NonResearchApplication,
    file: File,
    grantType: 'research' | 'nextgen' | 'nonresearch'
): Promise<{ success: boolean; applicationId: string; message: string }> => {
    try {
        // Convert file to base64 for secure transmission using browser-compatible API
        const fileData = await fileToBase64(file);

        // Call the secure cloud function
        const submitAppFunction = httpsCallable(functions, 'submitApplication');

        const result = await submitAppFunction({
            application,
            grantType,
            fileData,
            fileName: file.name,
            fileType: file.type
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
    nextGen: boolean
): Promise<{ success: boolean; applicationId: string; message: string }> => {
    const grantType = nextGen ? 'nextgen' : 'research';
    return await submitApplication(application, file, grantType);
};

// Legacy function for non-research applications (redirects to new secure function)
export const uploadNonResearchApplication = async (
    application: NonResearchApplication,
    file: File
): Promise<{ success: boolean; applicationId: string; message: string }> => {
    return await submitApplication(application, file, 'nonresearch');
};
