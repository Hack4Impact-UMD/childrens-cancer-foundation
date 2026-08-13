import {
    collection,
    doc,
    setDoc,
    getDoc,

    getDocs,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../index";
import {Decision, DecisionComments} from "../types/decision-types"

// Applicants can read their own /decision-data doc, so nothing internal may be
// stored on it. Internal award comments live in /decision-comments, which is
// admin-only in firestore.rules and is read through the *Comments helpers below.
const COMMENTS_COLLECTION = "decision-comments";

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

// Update the internal comments for an application (admin-only collection)
export const updateDecisionComments = async (applicationId: string, comments: string): Promise<void> => {
    try {
        const commentsRef = doc(db, COMMENTS_COLLECTION, applicationId);
        await setDoc(commentsRef, {
            applicationId,
            comments,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error updating admin comments:", error);
        throw error;
    }
};

// Get the internal comments for an application. Admin-only — calling this from
// an applicant or reviewer surface is denied by the rules.
export const getDecisionComments = async (applicationId: string): Promise<string> => {
    try {
        const commentsRef = doc(db, COMMENTS_COLLECTION, applicationId);
        const commentsDoc = await getDoc(commentsRef);
        return commentsDoc.exists() ? (commentsDoc.data() as DecisionComments).comments || "" : "";
    } catch (error) {
        console.error("Error getting admin comments:", error);
        throw error;
    }
};

// Get the internal comments for multiple applications, keyed by application id.
export const getMultipleDecisionComments = async (applicationIds: string[]): Promise<{ [applicationId: string]: string }> => {
    try {
        const commentsMap: { [applicationId: string]: string } = {};

        const commentsRef = collection(db, COMMENTS_COLLECTION);
        const commentsSnapshot = await getDocs(commentsRef);

        commentsSnapshot.forEach((doc) => {
            const data = doc.data() as DecisionComments;
            if (applicationIds.includes(data.applicationId) && data.comments) {
                commentsMap[data.applicationId] = data.comments;
            }
        });

        return commentsMap;
    } catch (error) {
        console.error("Error getting multiple admin comments:", error);
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