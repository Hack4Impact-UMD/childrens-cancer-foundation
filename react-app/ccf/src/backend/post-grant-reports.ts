import { PostGrantReport } from "../types/post-grant-report-types";
import { db } from "../index"
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth } from "../index";

export const getReportByApplicationID = async (id: string): Promise<PostGrantReport> => {
    const q = query(collection(db, "post-grant-reports"), where("applicationId", "==", id))
    const querySnapshot = await getDocs(q)
    const reports: Array<PostGrantReport> = []
    querySnapshot.docs.forEach((doc) => reports.push(doc.data() as unknown as PostGrantReport))
    if (reports.length == 0) {
        throw Error("Not Found")
    }
    return reports[0]
}

export const checkIfReportSubmitted = async (applicationId: string): Promise<boolean> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            return false;
        }
        
        // Query by userId first (as per security rules), then filter by applicationId
        const q = query(collection(db, "post-grant-reports"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        
        // Check if any of the user's reports match the applicationId
        return querySnapshot.docs.some(doc => {
            const reportData = doc.data();
            return reportData.applicationId === applicationId;
        });
    } catch (error) {
        console.error("Error checking if report submitted:", error)
        return false
    }
}

export const getReportsByUser = async (userId: string): Promise<PostGrantReport[]> => {
    try {
        const q = query(collection(db, "post-grant-reports"), where("userId", "==", userId))
        const querySnapshot = await getDocs(q)
        const reports: PostGrantReport[] = []
        querySnapshot.docs.forEach((doc) => {
            reports.push({
                ...doc.data(),
                id: doc.id
            } as PostGrantReport)
        })
        return reports
    } catch (error) {
        console.error("Error getting reports by user:", error)
        return []
    }
}