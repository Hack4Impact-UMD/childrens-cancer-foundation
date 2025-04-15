import { doc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../index';
import { uploadFileToStorage } from "../storage/storage";
import { getAuth } from "firebase/auth";

const writePostGrantReport = async(file: File) => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error("User not logged in");
        }
        
        const investigatorName = (document.getElementById("InvestigatorName") as HTMLInputElement)?.value;
        const institutionName = (document.getElementById("InstitutionName") as HTMLInputElement)?.value;
        
        const pdfUrl = await uploadFileToStorage(file);

        const reportId = Date.now().toString();
        const newReportRef = doc(db, 'post-grant-reports', reportId);
        await setDoc(newReportRef, {
            pdf: pdfUrl,
            userId: user.uid,
            investigatorName: investigatorName,
            institutionName: institutionName,
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
        console.error("Error writing application data:", error);
        throw error;
    }
};

export { writePostGrantReport };