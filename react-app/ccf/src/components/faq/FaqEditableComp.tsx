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
    const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());
    const [editingIndices, setEditingIndices] = useState<Set<number>>(new Set());
    const [questionValues, setQuestionValues] = useState<{[key: number]: string}>(() => {
        const initialQuestions: {[key: number]: string} = {};
        faqs.forEach((faq, index) => {
            initialQuestions[index] = faq.question;
        });
        return initialQuestions;
    });
    const [answerValues, setAnswerValues] = useState<{[key: number]: string}>(() => {
        const initialAnswers: {[key: number]: string} = {};
        faqs.forEach((faq, index) => {
            initialAnswers[index] = faq.answer;
        });
        return initialAnswers;
    });

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

    const toggleEdit = (index: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
        if (!activeIndices.has(index)) {
            toggleFAQ(index);
        }
    };

    const handleQuestionChange = (index: number, newValue: string) => {
        setQuestionValues(prev => ({
            ...prev,
            [index]: newValue
        }));
    };

    const handleAnswerChange = (index: number, newValue: string) => {
        setAnswerValues(prev => ({
            ...prev,
            [index]: newValue
        }));
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
                            <div className="expand-icon">{activeIndices.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}</div>
                            <Button
                                onClick={(e) => { toggleFAQ(index); toggleEdit(index, e); }}
                                className="edit-toggle-button"
                                startIcon={<EditIcon />}
                                size="small"
                                variant={editingIndices.has(index) ? "contained" : "outlined"}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            {editingIndices.has(index)  ? (
                                <Box>
                                    <TextField
                                        label="Update Frequently Asked Question"
                                        value={questionValues[index] || faq.question}
                                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                                        variant="outlined"
                                        sx={{ minWidth: '100%' }}
                                        className="markdown-input" />
                                </Box>
                            ) : (
                                <Typography onClick={() => toggleFAQ(index)} variant="h6" component="p" style={{ marginLeft: '8px' }}>
                                    {questionValues[index] || faq.question}
                                </Typography>
                            )}
                        </div>
                    </div>
                    {(editingIndices.has(index) || activeIndices.has(index)) && (
                        <div className="faq-answer">
                            <div className="markdown-preview-light" onChange={() => handleAnswerChange(index, answerValues[index])}>
                                <MarkdownPreviewer
                                    _text={answerValues[index] || faq.answer}
                                    _previewOnly={!editingIndices.has(index)} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EditableFAQComponent;
