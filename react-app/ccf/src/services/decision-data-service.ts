import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    getDocs,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../index";
import {Decision} from "../types/decision-types"

// Create or update admin data for an application
export const updateDecisionData = async (applicationId: string, adminData: Partial<Decision>): Promise<void> => {
    try {
        const adminDataRef = doc(db, "decision-data", applicationId);
        await setDoc(adminDataRef, {
            applicationId,
            ...adminData,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error updating admin data:", error);
        throw error;
    }
};

// Get admin data for an application
export const getDecisionData = async (applicationId: string): Promise<Decision | null> => {
    try {
        const adminDataRef = doc(db, "decision-data", applicationId);
        const adminDataDoc = await getDoc(adminDataRef);

        if (adminDataDoc.exists()) {
            return adminDataDoc.data() as Decision;
        }
        return null;
    } catch (error) {
        console.error("Error getting admin data:", error);
        throw error;
    }
};

// Get admin data for multiple applications
export const getMultipleDecisionData = async (applicationIds: string[]): Promise<{ [applicationId: string]: Decision }> => {
    try {
        const adminDataMap: { [applicationId: string]: Decision } = {};

        // Get all admin data documents
        const adminDataRef = collection(db, "decision-data");
        const adminDataSnapshot = await getDocs(adminDataRef);

        adminDataSnapshot.forEach((doc) => {
            const data = doc.data() as Decision;
            if (applicationIds.includes(data.applicationId)) {
                adminDataMap[data.applicationId] = data;
            }
        });

        return adminDataMap;
    } catch (error) {
        console.error("Error getting multiple admin data:", error);
        throw error;
    }
};

// Update only comments for an application
export const updateDecisionComments = async (applicationId: string, comments: string): Promise<void> => {
    try {
        await updateDecisionData(applicationId, { comments });
    } catch (error) {
        console.error("Error updating admin comments:", error);
        throw error;
    }
};

// Update funding decision for an application
export const updateFundingDecision = async (
    applicationId: string,
    fundingAmount: number,
    decision: string,
    isAccepted: boolean
): Promise<void> => {
    try {
        await updateDecisionData(applicationId, { fundingAmount, decision, isAccepted });
    } catch (error) {
        console.error("Error updating funding decision:", error);
        throw error;
    }
}; 