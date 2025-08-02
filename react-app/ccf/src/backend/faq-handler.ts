import { collection, getDocs, query } from "firebase/firestore";
import { FAQItem } from "../types/faqTypes";
import { db } from "../index";

export const getFAQs = async () : Promise<Array<FAQItem>> => {
    const q = query(collection(db, "FAQs"))
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        return d.data() as FAQItem
    })
}

export const getFAQData = async () : Promise<Array<JSON>> => {
    const q = query(collection(db, "FAQs"))
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        return d.data() as JSON
    })
}
