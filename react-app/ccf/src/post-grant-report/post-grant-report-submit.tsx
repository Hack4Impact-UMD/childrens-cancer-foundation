import { doc, setDoc, collection } from "firebase/firestore";
import { db, auth } from '../index';
import { uploadFileToStorage } from "../storage/storage";

const writePostGrantReport = async (
    file: File,
    applicationId: string,
    applicationTitle?: string,
    grantType?: string,
    formData?: {
        investigatorName: string;
        institutionName: string;
        attestationDate: string;
    }
) => {
    try {
        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated to submit a post-grant report');
        }

        // Upload the file to storage
        const pdfUrl = await uploadFileToStorage(file);

        // Create the post-grant report document with auto-generated ID
        const newApplicationRef = doc(collection(db, 'post-grant-reports'));
        await setDoc(newApplicationRef, {
            pdf: pdfUrl,
            applicationId: applicationId,
            submittedAt: new Date(),
            investigatorName: formData?.investigatorName || "",
            institutionName: formData?.institutionName || "",
            attestationDate: formData?.attestationDate || "",
            status: 'submitted',
            userId: user.uid, // Add user ID for tracking
            userEmail: user.email, // Add user email for reference
            applicationTitle: applicationTitle || "",
            grantType: grantType || ""
        });

        console.log('Post-grant report submitted successfully');

    } catch (error) {
        console.error("Error writing application data:", error);
        throw error;
    }
};

export { writePostGrantReport };