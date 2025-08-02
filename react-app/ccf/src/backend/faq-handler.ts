import { collection, getDocs, query, doc, updateDoc } from "firebase/firestore";
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

export const uploadFAQ = async (faq: FAQItem) => {
    const docRef = doc(db, "FAQs", faq.id);
    await updateDoc(docRef, {
        question: faq.question,
        answer: faq.answer
    });
}

export const uploadFAQBatch = async (faqs: Array<FAQItem>) => {
    faqs.forEach(async (faq) => {
        await uploadFAQ(faq);
    });
}
