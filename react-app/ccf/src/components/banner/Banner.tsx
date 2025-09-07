import React, { useState } from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BannerProps {
  children: React.ReactNode;
}

const Banner: React.FC<BannerProps> = ({ children }) => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const handleCloseBanner = () => {
    setIsBannerVisible(false);
  };

  if (!isBannerVisible) return null;

  return (
    <Alert
      severity="error"
      onClose={handleCloseBanner}
      icon={false}
      sx={{
        backgroundColor: '#BE0019',
        color: 'white',
        padding: '20px',
        margin: '5px',
        fontSize: '24px',
        borderRadius: '4px',
        minHeight: '100px',
        border: '6px double white',
        '.MuiAlert-message': {
            flex: 1,
            textAlign: 'center',
        },
        '.MuiAlert-action': {
            alignItems: 'flex-start',
        }
      }}
    >
        {children}
    </Alert>
  );
};

export default Banner;