import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MarkdownPreviewer from '../markdown/Markdown';
import question from '../../assets/question.png';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

interface FAQComponentProps {
    faqs: FAQItem[];
}

const FAQComponent: React.FC<FAQComponentProps> = ({ faqs }) => {
  return (
    <Box sx={{ p: 3, bgcolor: '#f8f8f8' }}>
      {faqs.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 5, color: '#666', fontStyle: 'italic', bgcolor: '#f5f5f5', border: '1px solid #ddd', borderRadius: 1 }}>
          <Typography>No frequently asked questions available at the moment.</Typography>
        </Box>
      ) : (
        faqs.map((faq, index) => (
          <Accordion key={index} sx={{ border: '2px solid #b71c1c', borderRadius: '5px', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#b71c1c' }} />}
              aria-controls={`panel${index}a-content`}
              id={`panel${index}a-header`}
            >
              <img src={question} alt="Question Icon" style={{ width: '25px', marginRight: '10px' }} />
              <Typography sx={{ fontWeight: 'bold', fontSize: '18px', color: '#b71c1c' }}>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '2px solid #b71c1c', p: 2 }}>
              <MarkdownPreviewer _text={faq.answer} _previewOnly={true} />
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default FAQComponent;
