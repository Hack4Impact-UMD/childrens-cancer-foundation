import React, { useState, useEffect } from 'react';
import './FAQComponent.css';
import { FAQComponentProps } from '../../types/faqTypes';
import MarkdownPreviewer from '../markdown/Markdown';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import { uploadFAQ, deleteFAQ } from '../../backend/faq-handler';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface EditableFAQComponentProps extends FAQComponentProps {
    onFAQDeleted?: () => void;
}

const EditableFAQComponent: React.FC<EditableFAQComponentProps> = ({ faqs, onFAQDeleted }) => {
    const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());
    const [editingIndices, setEditingIndices] = useState<Set<number>>(new Set());
    const [questionValues, setQuestionValues] = useState<{ [key: number]: string }>({});
    const [answerValues, setAnswerValues] = useState<{ [key: number]: string }>({});

    // Initialize and update state when faqs prop changes
    useEffect(() => {
        const initialQuestions: { [key: number]: string } = {};
        const initialAnswers: { [key: number]: string } = {};

        faqs.forEach((faq, index) => {
            initialQuestions[index] = faq.question;
            initialAnswers[index] = faq.answer;
        });

        setQuestionValues(initialQuestions);
        setAnswerValues(initialAnswers);

        // Reset editing and active states when FAQ list changes
        setActiveIndices(new Set());
        setEditingIndices(new Set());
    }, [faqs]);

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
        if (newValue !== questionValues[index]) {
            setQuestionValues(prev => ({
                ...prev,
                [index]: newValue
            }));
        }
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

    const handleDeleteFAQ = async (faqId: string, event: React.MouseEvent) => {
        event.stopPropagation();

        if (window.confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) {
            try {
                await deleteFAQ(faqId);
                if (onFAQDeleted) {
                    onFAQDeleted();
                }
            } catch (error) {
                console.error('Error deleting FAQ:', error);
                alert('Error deleting FAQ. Please try again.');
            }
        }
    };

    return (
        <div className="faq-container">
            {faqs.map((faq, index) => (
                <div key={faq.id} className="faq-item">
                    <div className="faq-question">
                        <div className="faq-question-header">
                            <div className="faq-question-content">
                                <div className="expand-icon" onClick={() => toggleFAQ(index)} style={{ cursor: 'pointer' }}>
                                    {activeIndices.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </div>
                                <div className="faq-question-text">
                                    {editingIndices.has(index) ? (
                                        <Box sx={{ width: '100%' }}>
                                            <TextField
                                                label="Update Frequently Asked Question"
                                                value={questionValues[index] || faq.question}
                                                onChange={(e) => handleQuestionChange(index, e.target.value)}
                                                variant="outlined"
                                                fullWidth
                                                className="markdown-input"
                                            />
                                        </Box>
                                    ) : (
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
                                            {questionValues[index] || faq.question}
                                        </Typography>
                                    )}
                                </div>
                            </div>
                            <div className="faq-buttons-container">
                                <Button
                                    onClick={(e) => {
                                        toggleEdit(index, e);
                                        if (editingIndices.has(index) && (questionValues[index] || answerValues[index])) {
                                            updateFAQ(faq.id, questionValues[index] || faq.question, answerValues[index] || faq.answer);
                                        }
                                    }}
                                    className="edit-toggle-button"
                                    startIcon={!editingIndices.has(index) ? <EditIcon /> : <SaveIcon />}
                                    size="small"
                                    variant={editingIndices.has(index) ? "contained" : "outlined"}
                                    sx={{ minWidth: 'auto' }}
                                />
                                <IconButton
                                    onClick={(e) => handleDeleteFAQ(faq.id, e)}
                                    size="small"
                                    color="error"
                                    title="Delete FAQ"
                                    sx={{
                                        padding: '6px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #d32f2f',
                                        borderRadius: '4px',
                                        minWidth: 'auto',
                                        '&:hover': {
                                            backgroundColor: '#ffebee',
                                            borderColor: '#b71c1c'
                                        }
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </div>
                    </div>
                    {(editingIndices.has(index) || activeIndices.has(index)) && (
                        <div className="faq-answer">
                            <div className="markdown-preview-light">
                                <MarkdownPreviewer
                                    _text={answerValues[index] || faq.answer}
                                    _previewOnly={!editingIndices.has(index)}
                                    onChange={(newText: string) => handleAnswerChange(index, newText)}
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
