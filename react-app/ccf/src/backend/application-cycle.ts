import { collection, getDocs, updateDoc, doc, Timestamp, where, limit, query, addDoc } from "firebase/firestore";
import { db } from "../index";
import dayjs from "dayjs";
import ApplicationCycle from "../types/applicationCycle-types"

export const getCurrentCycle = async (): Promise<ApplicationCycle> => {
  const q = query(collection(db, "applicationCycles"), where("current", "==", true), limit(1))

  const snap = await getDocs(q);

  return snap.docs[0].data() as ApplicationCycle
}


export const getAllCycles = async (): Promise<Array<ApplicationCycle>> => {
  const q = query(collection(db, "applicationCycles"))

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    return d.data() as ApplicationCycle
  })
}

export const updateCycleStage = async (newStage: ApplicationCycle["stage"]): Promise<boolean> => {
  try {
    const q = query(collection(db, "applicationCycles"), where("current", "==", true), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error("No current application cycle found.");
      return false;
    }

    const docRef = snapshot.docs[0].ref;

    await updateDoc(docRef, {
      stage: newStage
    });

    return true;
  } catch (error) {
    console.error("Error updating cycle stage:", error);
    return false;
  }
};

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

export const endCurrentCycleAndStartNewOne = async (newCycleName: string) => {
  try {
    const q = query(collection(db, "applicationCycles"), where("current", "==", true), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const currentCycleDocRef = snapshot.docs[0].ref;
      await updateDoc(currentCycleDocRef, {
        current: false,
        endDate: Timestamp.now(),
      });
    }

    const oneYearFromNow = dayjs().add(1, 'year').toDate();

    await addDoc(collection(db, "applicationCycles"), {
      name: newCycleName,
      current: true,
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(oneYearFromNow),
      stage: 'Application Period',
      nextGenDeadline: Timestamp.fromDate(dayjs().add(6, 'month').hour(23).minute(59).toDate()),
      researchDeadline: Timestamp.fromDate(dayjs().add(6, 'month').hour(23).minute(59).toDate()),
      nonResearchDeadline: Timestamp.fromDate(dayjs().add(6, 'month').hour(23).minute(59).toDate()),
      reviewerDeadline: Timestamp.fromDate(dayjs().add(8, 'month').hour(23).minute(59).toDate()),
    });

    return true;
  } catch (error) {
    console.error("Error starting new cycle", error);
    return false;
  }
}
