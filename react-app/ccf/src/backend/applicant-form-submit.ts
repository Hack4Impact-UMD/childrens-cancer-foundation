import { doc, setDoc } from "firebase/firestore";
import { db } from '../index';
import { auth } from '../index';
import { uploadFileToStorage } from "../storage/storage";
import { ApplicationDetails, NonResearchApplication, ResearchApplication } from '../types/application-types';
import { getCurrentCycle } from "./application-cycle";
export const uploadResearchApplication = async( 
    application: ResearchApplication,
    file: File,
    nextGen: boolean
) => {
    try {
        const pdfUrl = await uploadFileToStorage(file);
        const user = auth.currentUser
        if (!user) {
            throw "User not found"
        }

        const currentCycle = await getCurrentCycle()

        const appDetails : ApplicationDetails = {
            file: pdfUrl,
            decision: 'pending',
            creatorId: user.uid,
            grantType: nextGen ? 'nextgen' : 'research',
            applicationCycle: currentCycle.name,
            submitTime: new Date()
        }
        
        const newApplicationRef = doc(db, 'applications');
        await setDoc(newApplicationRef, {
            ...application,
            ...appDetails 
        });

    } catch (error) {
        console.error("Error writing application data:", error);
        throw error;
    }
};

export const uploadNonResearchApplication = async( 
    application: NonResearchApplication,
    file: File 
) => {
    try {
        const pdfUrl = await uploadFileToStorage(file);
        const user = auth.currentUser
        if (!user) {
            throw "User not found"
        }

        const currentCycle = await getCurrentCycle()

        const appDetails : ApplicationDetails = {
            file: pdfUrl,
            decision: 'pending',
            creatorId: user.uid,
            grantType: 'nextgen',
            applicationCycle: currentCycle.name,
            submitTime: new Date(),
        }
        
        const newApplicationRef = doc(db, 'applications');
        await setDoc(newApplicationRef, {
            ...application,
            ...appDetails
        });

    } catch (error) {
        console.error("Error writing application data:", error);
        throw error;
    }
};
