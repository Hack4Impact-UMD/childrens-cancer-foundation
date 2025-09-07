import { Application } from '../../types/application-types';
import { DynamicApplication } from '../../types/form-template-types';
import Modal from '../modal/modal';
import Review from '../../pages/application-form/subquestions/Review';
import DynamicReview from './DynamicReview';
import { useEffect, useState } from 'react';
import { downloadPDFsByName } from '../../storage/storage';
import { Box, Typography, Button, Chip, Divider } from '@mui/material';
import blueDocument from '../../assets/blueDocumentIcon.png';

interface CoverPageModalProps {
  application: Application | DynamicApplication;
  isOpen: boolean;
  onClose: () => void;
}

const CoverPageModal = ({ application, isOpen, onClose }: CoverPageModalProps) => {
  const [pdfLink, setPdfLink] = useState<any>();

  const isDynamicApplication = (app: Application | DynamicApplication): app is DynamicApplication => {
    return 'formTemplateId' in app && 'formData' in app;
  };

  useEffect(() => {
    if (isOpen && application.file) {
      downloadPDFsByName([application.file])
        .then((links) => {
          if (links && links[0]) {
            setPdfLink(links[0]);
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [isOpen, application.file]);

  const getApplicationTitle = () => {
    return isDynamicApplication(application) ? application.title || 'Dynamic Application' : application.title || 'Application';
  };

  const getApplicationGrantType = () => {
    return application.grantType;
  };

  const modalContent = (
    <Box sx={{ p: 3, bgcolor: 'background.paper', height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2, p: 3, bgcolor: 'grey.100' }}>
        <img src={blueDocument} alt="Document Icon" style={{ width: 56, height: 56 }} />
        <Box>
          <Typography variant="h4" component="h2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {getApplicationTitle()}
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
            {getApplicationGrantType()}
          </Typography>
          {isDynamicApplication(application) && (
            <Chip label="Dynamic Form Application" color="success" size="small" sx={{ mt: 1 }} />
          )}
        </Box>
      </Box>
      {pdfLink && (
        <Button variant="contained" href={pdfLink.url} target="_blank" rel="noopener noreferrer" sx={{ my: 2 }}>
          View Application PDF
        </Button>
      )}
      <Divider sx={{ my: 3 }} />
      <Box>
        {isDynamicApplication(application) ? (
          <DynamicReview application={application} hideFile={true} />
        ) : (
          <Review type={application.grantType} formData={application} hideFile={true} />
        )}
      </Box>
    </Box>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'viewport-90'}>
      {modalContent}
    </Modal>
  );
};

export default CoverPageModal