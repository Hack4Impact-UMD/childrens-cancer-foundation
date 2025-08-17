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
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [questions, setQuestions] = useState<{[key: number]: {question: string, expanded: boolean}}> (() => {
        const initialQuestions: {[key: number]: {question: string, expanded: boolean}} = {};
        faqs.forEach((faq, index) => {
            initialQuestions[index] = { question: faq.question, expanded: false };
        });
        return initialQuestions;
    });

    const toggleFAQ = (index: number) => {
        questions[index].expanded = !questions[index].expanded;
    };

    const toggleEdit = (index: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingIndex(editingIndex === index ? null : index);
        questions[index].expanded = true;
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
                    >
                        <div className="faq-question-header">
                            <div className="expand-icon" onClick={() => toggleFAQ(index)}>{questions[index].expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</div>
                            <Button
                                onClick={(e) => { toggleEdit(index, e); }}
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
                                        value={questions[index].question}
                                        onChange={(e) => setQuestions({ ...questions, [index]: { ...questions[index], question: e.target.value } })}
                                        variant="outlined"
                                        sx={{ minWidth: '100%' }}
                                        className="markdown-input" />
                                </Box>
                            ) : (
                                <Typography variant="h6" onClick={() => toggleFAQ(index)} component="p" style={{ marginLeft: '8px' }}>
                                    {questions[index].question || faq.question}
                                </Typography>
                            )}
                        </div>
                    </div>
                    {questions[index].expanded && (
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
