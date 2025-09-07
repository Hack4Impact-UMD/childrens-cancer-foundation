import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box } from '@mui/material';
import { FaFileAlt, FaArrowRight, FaEye } from 'react-icons/fa';

export interface Application {
  id?: string;
  applicationType: string;
  dueDate: string;
  status?: string;
  title?: string;
  principalInvestigator?: string;
}

interface ApplicationBoxProps {
  id?: string;
  applicationType: string;
  dueDate: string;
  status?: string;
  title?: string;
  principalInvestigator?: string;
  onClick?: (dueDate: string, applicationId?: string) => void;
  onModalOpen?: (applicationId: string) => void;
}

const ApplicationBox: React.FC<ApplicationBoxProps> = ({
  id = '',
  applicationType,
  dueDate,
  status,
  title,
  principalInvestigator,
  onClick = () => {},
  onModalOpen = () => {},
}) => {
  const handleClick = () => {
    onClick(dueDate, id);
  };

  const handleModalOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      onModalOpen(id);
    } else {
      console.error('No application ID provided for modal');
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderRadius: '20px',
        backgroundColor: '#003E83',
        color: 'white',
        marginBottom: '20px',
        height: '50px',
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 0 }}>
        <FaFileAlt style={{ backgroundColor: '#F0C567', marginRight: '10px', color: '#003E83', padding: '5px', borderRadius: '4px' }} />
        <Box>
          {title && <Typography variant="h6" component="p" sx={{ margin: 0 }}>{title}</Typography>}
          <Typography variant="body1" component="p" sx={{ margin: 0 }}>
            {applicationType}{principalInvestigator ? ` - ${principalInvestigator}` : ''}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ p: 0 }}>
        <Button
          variant="contained"
          onClick={handleClick}
          endIcon={<FaArrowRight />}
          sx={{
            backgroundColor: 'rgba(217, 217, 217, 0.5)',
            '&:hover': { backgroundColor: 'rgba(217, 217, 217, 0.7)' },
            borderRadius: '8px',
            color: 'white',
            width: '100%',
          }}
        >
          {dueDate}
        </Button>
        <Button
          variant="contained"
          onClick={handleModalOpen}
          startIcon={<FaEye />}
          sx={{
            backgroundColor: '#F0C567',
            '&:hover': { backgroundColor: '#e6b94d' },
            borderRadius: '8px',
            color: '#003E83',
            fontWeight: 500,
            marginLeft: '10px',
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default ApplicationBox;