import { doc, setDoc } from "firebase/firestore";
import { db } from '../index';
import { uploadFileToStorage } from "../storage/storage";

const writePostGrantReport = async( 
    file: File 
) => {
    try {
        const pdfUrl = await uploadFileToStorage(file);
        const newApplicationRef = doc(db, 'post-grant-reports', Date.now().toString());
        await setDoc(newApplicationRef, {
            pdf: pdfUrl,

        });

    } catch (error) {
        console.error("Error writing application data:", error);
        throw error;
    }
};

export { writePostGrantReport };