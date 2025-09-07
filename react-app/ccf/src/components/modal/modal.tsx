import React from 'react';
import { Modal as MuiModal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'auto' | 'fullscreen' | 'viewport-90';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = 'auto' }) => {
  const getModalStyle = () => {
    switch (size) {
      case 'fullscreen':
        return {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          borderRadius: 0,
          boxShadow: 'none',
        };
      case 'viewport-90':
        return {
          width: '90vw',
          height: '90vh',
        };
      case 'auto':
      default:
        return {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
        };
    }
  };

  return (
    <MuiModal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={getModalStyle()}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {title && <Typography id="modal-title" variant="h6" component="h2">{title}</Typography>}
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </MuiModal>
  );
};

export default Modal;
