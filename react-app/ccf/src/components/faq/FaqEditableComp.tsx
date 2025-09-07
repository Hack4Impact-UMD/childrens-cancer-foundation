import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import MarkdownPreviewer from '../markdown/Markdown';
import { uploadFAQ, deleteFAQ } from '../../backend/faq-handler';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

interface EditableFAQComponentProps {
    faqs: FAQItem[];
    onFAQDeleted?: () => void;
}

const EditableFAQComponent: React.FC<EditableFAQComponentProps> = ({ faqs, onFAQDeleted }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedFaqs, setEditedFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    setEditedFaqs(faqs);
  }, [faqs]);

  const handleEditToggle = (index: number) => {
    if (editingIndex === index) {
      handleSave(index);
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
    }
  };

  const handleSave = async (index: number) => {
    const faq = editedFaqs[index];
    await uploadFAQ(faq);
  };

  const handleDelete = async (faqId: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      await deleteFAQ(faqId);
      if (onFAQDeleted) {
        onFAQDeleted();
      }
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newFaqs = [...editedFaqs];
    newFaqs[index] = { ...newFaqs[index], question: value };
    setEditedFaqs(newFaqs);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newFaqs = [...editedFaqs];
    newFaqs[index] = { ...newFaqs[index], answer: value };
    setEditedFaqs(newFaqs);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f8f8' }}>
      {editedFaqs.map((faq, index) => (
        <Accordion
          key={faq.id}
          sx={{ border: '2px solid #b71c1c', borderRadius: '5px', mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#b71c1c' }} />}
            aria-controls={`panel${index}a-content`}
            id={`panel${index}a-header`}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {editingIndex === index ? (
                <TextField
                  value={faq.question}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  fullWidth
                  variant="standard"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Typography sx={{ fontWeight: 'bold', fontSize: '18px', color: '#b71c1c' }}>{faq.question}</Typography>
              )}
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <IconButton onClick={(e) => {e.stopPropagation(); handleEditToggle(index);}} size="small">
                  {editingIndex === index ? <SaveIcon /> : <EditIcon />}
                </IconButton>
                <IconButton onClick={(e) => {e.stopPropagation(); handleDelete(faq.id);}} size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ borderTop: '2px solid #b71c1c', p: 2 }}>
            {editingIndex === index ? (
              <MarkdownPreviewer
                _text={faq.answer}
                onChange={(text) => handleAnswerChange(index, text)}
              />
            ) : (
              <MarkdownPreviewer _text={faq.answer} _previewOnly={true} />
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default EditableFAQComponent;
