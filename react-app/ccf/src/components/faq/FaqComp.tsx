import React, { useState } from 'react';
import './FAQComponent.css';
import { FAQComponentProps } from '../../types/faqTypes';
import MarkdownPreviewer from '../markdown/Markdown';
import { Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const FAQComponent: React.FC<FAQComponentProps> = ({ faqs }) => {
    const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());

    const toggleFAQ = (index: number) => {
        setActiveIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    return (
        <div className="faq-container">
            {faqs.length === 0 ? (
                <div className="faq-empty-state">
                    <p>No frequently asked questions available at the moment.</p>
                </div>
            ) : (
                faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <div className="faq-question">
                            <div className="faq-question-header">
                                <div className="faq-question-content">
                                    <div
                                        className="expand-icon"
                                        onClick={() => toggleFAQ(index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {activeIndices.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </div>
                                    <div className="faq-question-text">
                                        <Typography
                                            onClick={() => toggleFAQ(index)}
                                            variant="h6"
                                            component="p"
                                            sx={{
                                                cursor: 'pointer',
                                                margin: 0,
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                color: '#b71c1c'
                                            }}
                                        >
                                            {faq.question}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {activeIndices.has(index) && (
                            <div className="faq-answer">
                                <div className="markdown-preview-light">
                                    <MarkdownPreviewer _text={faq.answer} _previewOnly={true} />
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default FAQComponent;
