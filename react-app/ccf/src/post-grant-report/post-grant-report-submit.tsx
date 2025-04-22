import { doc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../index';
import { uploadFileToStorage } from "../storage/storage";
import { getAuth } from "firebase/auth";

export interface PostGrantFormData {
  investigatorName: string;
  institutionName: string;
  attestationDate: string;
}

export const writePostGrantReport = async(file: File, formData: PostGrantFormData) => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error("User not logged in");
        }
        
        const pdfUrl = await uploadFileToStorage(file);

        const reportId = Date.now().toString();
        const newReportRef = doc(db, 'post-grant-reports', reportId);
        await setDoc(newReportRef, {
            pdf: pdfUrl,
            userId: user.uid,
            investigatorName: formData.investigatorName,
            institutionName: formData.institutionName,
            attestationDate: formData.attestationDate,
            submittedAt: new Date()
        });
    
        const applicationsRef = collection(db, "applications");
        const q = query(
            applicationsRef, 
            where("userId", "==", user.uid),
            where("status", "==", "APPROVED"),
            where("postGrantReportSubmitted", "==", false)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const appDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, "applications", appDoc.id), {
                postGrantReportSubmitted: true,
                postGrantReportId: reportId,
                postGrantReportDate: new Date()
            });
        }
        
        return reportId;
    } catch (error) {
        console.error("Error writing post grant report data:", error);
        throw error;
    }
};