export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

export interface FAQComponentProps {
    faqs: FAQItem[];
}
