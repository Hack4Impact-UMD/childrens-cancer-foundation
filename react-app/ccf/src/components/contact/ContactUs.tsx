import React from 'react';
import { Box, Typography, Link, Paper } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

interface ContactUsProps {
  email: string;
  phone: string;
  hours: string;
}

const ContactUs: React.FC<ContactUsProps> = ({ email, phone, hours }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        border: '3px solid #BE0019',
        p: 4,
        borderRadius: 2,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 4,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmailIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Email Support</Typography>
        </Box>
        <Typography paragraph>
          Email us and we'll get back to you as soon as possible.
        </Typography>
        <Link href={`mailto:${email}`} underline="hover">
          {email}
        </Link>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PhoneIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Call Support</Typography>
        </Box>
        <Typography paragraph>
          Call us and we'll get back to you as soon as possible.
        </Typography>
        <Link href={`tel:${phone}`} underline="hover">
          {phone}
        </Link>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {hours}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ContactUs;
