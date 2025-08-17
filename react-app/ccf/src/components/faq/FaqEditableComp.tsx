import React, { useState } from 'react';
import './FAQComponent.css';
import { FAQComponentProps } from '../../types/faqTypes';
import MarkdownPreviewer from '../markdown/Markdown';
import { Box, TextField, Button, Typography } from '@mui/material';
import { uploadFAQ, uploadFAQBatch } from '../../backend/faq-handler';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const EditableFAQComponent: React.FC<FAQComponentProps> = ({ faqs }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [questions, setQuestions] = useState<{[key: number]: string}>(() => {
        const initialQuestions: {[key: number]: string} = {};
        faqs.forEach((faq, index) => {
            initialQuestions[index] = faq.question;
        });
        return initialQuestions;
    });

    const toggleFAQ = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const toggleEdit = (index: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingIndex(editingIndex === index ? null : index);
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
                    >
                        <div className="faq-question-header">
                            <div className="expand-icon">{activeIndex === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}</div>
                            <Button
                                onClick={(e) => toggleEdit(index, e)}
                                className="edit-toggle-button"
                                startIcon={<EditIcon />}
                                size="small"
                                variant={editingIndex === index ? "contained" : "outlined"}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            {editingIndex === index ? (
                                <Box>
                                    <TextField
                                        label="Update Frequently Asked Question"
                                        value={questions[index] || faq.question}
                                        onChange={(e) => setQuestions({ ...questions, [index]: e.target.value })}
                                        variant="outlined"
                                        sx={{ minWidth: '100%' }}
                                        className="markdown-input" />
                                </Box>
                            ) : (
                                <Typography variant="h6" component="p" style={{ marginLeft: '8px' }}>
                                    {questions[index] || faq.question}
                                </Typography>
                            )}
                        </div>
                    </div>
                    {activeIndex === index && (
                        <div className="faq-answer">
                            <div className="markdown-preview-light">
                                <MarkdownPreviewer _text={faq.answer} _previewOnly={editingIndex !== index} />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EditableFAQComponent;
