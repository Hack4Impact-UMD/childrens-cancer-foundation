import { collection, getDocs, query, doc, updateDoc, setDoc } from "firebase/firestore";
import { FAQItem } from "../types/faqTypes";
import { db } from "../index";

export const getFAQs = async (): Promise<Array<FAQItem>> => {
    try {
        console.log('Fetching FAQs from Firebase...');
        const q = query(collection(db, "FAQs"))
        const snap = await getDocs(q);
        console.log('FAQ documents found:', snap.docs.length);
        const faqs = snap.docs.map((d) => {
            return { id: d.id, ...d.data() } as FAQItem
        });
        console.log('Processed FAQs:', faqs);
        return faqs;
    } catch (error) {
        console.error('Error in getFAQs:', error);
        return [];
    }
}

export const getFAQData = async (): Promise<Array<JSON>> => {
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

export const addFAQ = async (faq: FAQItem) => {
    const docRef = doc(db, "FAQs", faq.id);
    await setDoc(docRef, {
        question: faq.question,
        answer: faq.answer
    });
}

export const createNewFAQ = async (question: string, answer: string) => {
    try {
        // Generate a unique ID for the new FAQ
        const newId = Date.now().toString();
        const newFAQ: FAQItem = {
            id: newId,
            question: question.trim(),
            answer: answer.trim()
        };

        await addFAQ(newFAQ);
        console.log('New FAQ created successfully:', newFAQ);
        return newFAQ;
    } catch (error) {
        console.error('Error creating new FAQ:', error);
        throw error;
    }
}

export const initializeSampleFAQs = async () => {
    const sampleFAQs: FAQItem[] = [
        {
            id: "1",
            question: "What types of grants does the Children's Cancer Foundation offer?",
            answer: "The Children's Cancer Foundation offers several types of grants including Research Grants, NextGen Grants, and Non-Research Grants. Each type has specific eligibility criteria and funding amounts."
        },
        {
            id: "2",
            question: "How do I apply for a grant?",
            answer: "To apply for a grant, you must first create an account as an applicant. Once logged in, you can access the application form through your dashboard. Make sure to complete all required sections and submit before the deadline."
        },
        {
            id: "3",
            question: "What is the application deadline?",
            answer: "Application deadlines vary by grant cycle. Please check the current application cycle information on your dashboard for specific dates. Applications submitted after the deadline will not be considered."
        },
        {
            id: "4",
            question: "How will I know if my application was accepted?",
            answer: "You will receive a notification through your dashboard once the review process is complete. You can also check the status of your applications in the 'My Applications' section of your dashboard."
        },
        {
            id: "5",
            question: "What documents do I need to submit with my application?",
            answer: "Required documents typically include a detailed research proposal, budget justification, CV/resume, and any additional supporting materials specified in the grant guidelines. Please refer to the specific grant type requirements for complete details."
        }
    ];

    try {
        for (const faq of sampleFAQs) {
            await addFAQ(faq);
        }
        console.log('Sample FAQs initialized successfully');
    } catch (error) {
        console.error('Error initializing sample FAQs:', error);
    }
}
