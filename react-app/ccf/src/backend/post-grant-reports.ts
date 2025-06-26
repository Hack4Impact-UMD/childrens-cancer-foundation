import { PostGrantReport } from "../types/post-grant-report-types";
import {db} from "../index"
import { collection, getDocs, query, where } from "firebase/firestore";

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