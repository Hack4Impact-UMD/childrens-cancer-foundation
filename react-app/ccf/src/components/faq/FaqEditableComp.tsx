import React, { useState } from 'react';
import './FAQComponent.css';
import { FAQComponentProps } from '../../types/faqTypes';
import MarkdownPreviewer from '../markdown/Markdown';
import { Box, TextField } from '@mui/material';
import { uploadFAQ, uploadFAQBatch } from '../../backend/faq-handler';

const EditableFAQComponent: React.FC<FAQComponentProps> = ({ faqs }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const updateFAQ = (id: string, question: string, answer: string) => {
        uploadFAQ({ id: id.trim(), question: question.trim(), answer: answer.trim() });
    };

    return (
        <div className="faq-container">
            {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                    <div
                        className="faq-question"
                        onClick={() => toggleFAQ(index)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'left' }}
                    >
                        <p>
                            <Box className="markdown">
                                <TextField
                                    label="Enter Frequently Asked Question"
                                    value={faq.question}
                                    variant="outlined"
                                    className="markdown-input" />
                            </Box>
                        </p>
                    </div>
                    {activeIndex === index && (
                        <div className="faq-answer">
                            <MarkdownPreviewer _text={faq.answer} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EditableFAQComponent;
