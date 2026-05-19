import { collection, getDocs, updateDoc, doc, Timestamp, where, limit, query, addDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../index";
import dayjs from "dayjs";
import ApplicationCycle from "../types/applicationCycle-types"

const buildApplicationCycle = (docSnap: any): ApplicationCycle => {
  const cycle = docSnap.data();

  return {
    id: docSnap.id,
    ...cycle,
    applicationsReopenedManually: cycle.applicationsReopenedManually === true,
    researchDeadline: (cycle.allApplicationsDeadline || cycle.researchDeadline as Timestamp).toDate(),
    nonResearchDeadline: (cycle.allApplicationsDeadline || cycle.nonResearchDeadline as Timestamp).toDate(),
    nextGenDeadline: (cycle.allApplicationsDeadline || cycle.nextGenDeadline as Timestamp).toDate(),
    allApplicationsDeadline: (cycle.allApplicationsDeadline as Timestamp).toDate(),
    reviewerDeadline: (cycle.reviewerDeadline as Timestamp).toDate(),
    startDate: (cycle.startDate as Timestamp).toDate(),
    endDate: (cycle.endDate as Timestamp).toDate(),
    postGrantReportDeadline: cycle.postGrantReportDeadline ? (cycle.postGrantReportDeadline as Timestamp).toDate() : undefined
  } as ApplicationCycle;
};

const hasDeadlinePassed = (deadline?: Date): boolean => {
  return !!deadline && Date.now() > deadline.getTime();
};

const shouldAutoCloseApplications = (cycle: ApplicationCycle): boolean => {
  return (
    cycle.stage === "Applications Open" &&
    !cycle.applicationsReopenedManually &&
    hasDeadlinePassed(cycle.allApplicationsDeadline)
  );
};

const syncCurrentCycleStage = async (): Promise<void> => {
  const syncCycleStage = httpsCallable(functions, "syncCurrentCycleStage");
  await syncCycleStage();
};

export const getCurrentCycle = async (): Promise<ApplicationCycle> => {
  const q = query(collection(db, "applicationCycles"), where("current", "==", true), limit(1))

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("No current application cycle found");
  }

  return checkAndUpdateCycleStageIfNeeded(buildApplicationCycle(snap.docs[0]));
}


export const getAllCycles = async (): Promise<Array<ApplicationCycle>> => {
  const q = query(collection(db, "applicationCycles"))

  const snap = await getDocs(q);
  return snap.docs.map((d) => buildApplicationCycle(d))
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
    const currentCycle = buildApplicationCycle(snapshot.docs[0]);

    await updateDoc(docRef, {
      stage: newStage,
      applicationsReopenedManually:
        newStage === "Applications Open" && hasDeadlinePassed(currentCycle.allApplicationsDeadline)
    });

    return true;
  } catch (error) {
    console.error("Error updating cycle stage:", error);
    return false;
  }
};

// update application cycle deadlines
export const updateCurrentCycleDeadlines = async (deadlines: {
  allApplicationsDate?: dayjs.Dayjs | null;

  // keeping below old parameter names for backwards compatibility
  nextGenDate?: dayjs.Dayjs | null;
  researchDate?: dayjs.Dayjs | null;
  nonResearchDate?: dayjs.Dayjs | null;

  reviewerDate?: dayjs.Dayjs | null;
  postGrantReportDate?: dayjs.Dayjs | null;
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
    if (deadlines.allApplicationsDate) {
      const timestamp = toTimestampAt1159PM(deadlines.allApplicationsDate);
      updateData.allApplicationsDeadline = timestamp;
      updateData.nextGenDeadline = timestamp;
      updateData.researchDeadline = timestamp;
      updateData.nonResearchDeadline = timestamp;
      updateData.applicationsReopenedManually = false;
    }

    // for backwards compatibility
    if (deadlines.nextGenDate || deadlines.researchDate || deadlines.nonResearchDate) {
      const universalDate = deadlines.nextGenDate || deadlines.researchDate || deadlines.nonResearchDate;
      if (universalDate) {
        const timestamp = toTimestampAt1159PM(universalDate);
        updateData.allApplicationsDeadline = timestamp;
        updateData.nextGenDeadline = timestamp;
        updateData.researchDeadline = timestamp;
        updateData.nonResearchDeadline = timestamp;
        updateData.applicationsReopenedManually = false;
      }
    }

    if (deadlines.reviewerDate) updateData.reviewerDeadline = toTimestampAt1159PM(deadlines.reviewerDate);
    if (deadlines.postGrantReportDate) updateData.postGrantReportDeadline = toTimestampAt1159PM(deadlines.postGrantReportDate);

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
      stage: 'Applications Open',
      applicationsReopenedManually: false,
      allApplicationsDeadline: Timestamp.fromDate(dayjs().add(6, 'month').hour(23).minute(59).toDate()),
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

// Auto-update cycle stage if application deadline has passed
export const checkAndUpdateCycleStageIfNeeded = async (cycle: ApplicationCycle): Promise<ApplicationCycle> => {
  const closedCycle: ApplicationCycle = {
    ...cycle,
    stage: "Applications Closed",
    applicationsReopenedManually: false
  };

  try {
    if (!shouldAutoCloseApplications(cycle)) {
      return cycle;
    }

    await syncCurrentCycleStage();
    return closedCycle;
  } catch (error) {
    console.error("Error checking cycle stage:", error);
    return closedCycle;
  }
}

// Get number of days remaining until deadline
export const getDaysUntilDeadline = (deadline: Date): number => {
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
