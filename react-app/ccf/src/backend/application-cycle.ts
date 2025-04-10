import {db} from "../index"
import {collection, query, getDocs, where, limit} from "firebase/firestore"
import ApplicationCycle from "../types/applicationCycle-types"

export const getCurrentCycle = async (): Promise<ApplicationCycle> => {
    const q = query(collection(db, "applicationCycles"), where("current", "==", true), limit(1))

    const snap = await getDocs(q);
    
    return snap.docs[0].data() as ApplicationCycle
}

export const getAllCycles = async () : Promise<Array<ApplicationCycle>> => {
    const q = query(collection(db, "applicationCycles"))

    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        return d.data() as ApplicationCycle
    })
}