export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQComponentProps {
    faqs: FAQItem[];
}
