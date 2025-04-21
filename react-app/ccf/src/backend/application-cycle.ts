// import {db} from "../index"
// import {collection, query, getDocs, where, limit} from "firebase/firestore"
// // import ApplicationCycle from "../types/applicationCycle-types"

// // export const getCurrentCycle = async (): Promise<ApplicationCycle> => {
// //     const q = query(collection(db, "applicationCycles"), where("current", "==", true), limit(1))

// //     const snap = await getDocs(q);
    
// //     return snap.docs[0].data() as ApplicationCycle
// // }

// // export const getAllCycles = async () : Promise<Array<ApplicationCycle>> => {
// //     const q = query(collection(db, "applicationCycles"))

// //     const snap = await getDocs(q);
// //     return snap.docs.map((d) => {
// //         return d.data() as ApplicationCycle
// //     })
// // }
// // 
// // 
// // 
import { collection, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../index";
import dayjs from "dayjs";

// update application cycle deadlines
export const updateCurrentCycleDeadlines = async (deadlines: {
  nextGenDate?: dayjs.Dayjs | null;
  researchDate?: dayjs.Dayjs | null;
  nonResearchDate?: dayjs.Dayjs | null;
  reviewerDate?: dayjs.Dayjs | null;
}) => {
  try {
    const querySnapshot = await getDocs(collection(db, "applicationCycles"));
    let currentDocId = "";
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.current === true) {
        currentDocId = docSnap.id;
      }
    });

    //catch error
    if (!currentDocId) throw new Error("No current application cycle found.");
    
    
    //make applications due at 11:59
    const toTimestampAt1159PM = (date: dayjs.Dayjs) =>
         Timestamp.fromDate(date.hour(23).minute(59).second(0).millisecond(0).toDate());


    const updateData: any = {};
    if (deadlines.nextGenDate) updateData.nextGenDeadline = toTimestampAt1159PM(deadlines.nextGenDate);
    if (deadlines.researchDate) updateData.researchDeadline = toTimestampAt1159PM(deadlines.researchDate);
    if (deadlines.nonResearchDate) updateData.nonResearchDeadline = toTimestampAt1159PM(deadlines.nonResearchDate);
    if (deadlines.reviewerDate) updateData.reviewerDeadline = toTimestampAt1159PM(deadlines.reviewerDate);

    await updateDoc(doc(db, "applicationCycles", currentDocId), updateData);

    return true;
  } catch (error) {
    console.error("Failed to update deadlines:", error);
    return false;
  }
};
