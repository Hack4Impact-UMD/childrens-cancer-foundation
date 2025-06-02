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

export interface AdminData {
    applicationId: string;
    comments?: string;
    fundingAmount?: number;
    decision?: string;
    lastUpdated?: any; // Firebase Timestamp
    createdAt?: any; // Firebase Timestamp
}

// Create or update admin data for an application
export const updateAdminData = async (applicationId: string, adminData: Partial<AdminData>): Promise<void> => {
    try {
        const adminDataRef = doc(db, "admin_data", applicationId);
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
export const getAdminData = async (applicationId: string): Promise<AdminData | null> => {
    try {
        const adminDataRef = doc(db, "admin_data", applicationId);
        const adminDataDoc = await getDoc(adminDataRef);

        if (adminDataDoc.exists()) {
            return adminDataDoc.data() as AdminData;
        }
        return null;
    } catch (error) {
        console.error("Error getting admin data:", error);
        throw error;
    }
};

// Get admin data for multiple applications
export const getMultipleAdminData = async (applicationIds: string[]): Promise<{ [applicationId: string]: AdminData }> => {
    try {
        const adminDataMap: { [applicationId: string]: AdminData } = {};

        // Get all admin data documents
        const adminDataRef = collection(db, "admin_data");
        const adminDataSnapshot = await getDocs(adminDataRef);

        adminDataSnapshot.forEach((doc) => {
            const data = doc.data() as AdminData;
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
export const updateAdminComments = async (applicationId: string, comments: string): Promise<void> => {
    try {
        await updateAdminData(applicationId, { comments });
    } catch (error) {
        console.error("Error updating admin comments:", error);
        throw error;
    }
};

// Update funding decision for an application
export const updateFundingDecision = async (
    applicationId: string,
    fundingAmount: number,
    decision: string
): Promise<void> => {
    try {
        await updateAdminData(applicationId, { fundingAmount, decision });
    } catch (error) {
        console.error("Error updating funding decision:", error);
        throw error;
    }
}; 