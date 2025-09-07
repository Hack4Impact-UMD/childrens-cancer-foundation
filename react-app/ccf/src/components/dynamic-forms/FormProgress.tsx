import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepIconProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';

interface FormProgressProps {
  currentPage: number;
  totalPages: number;
  pageNames: string[];
}

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 32,
  height: 32,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    background: theme.palette.primary.main,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    background: theme.palette.success.main,
  }),
}));

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <Check />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : <>{String(props.icon)}</>}
    </ColorlibStepIconRoot>
  );
}

const FormProgress: React.FC<FormProgressProps> = ({
  currentPage,
  totalPages,
  pageNames,
}) => {
  const progressPercentage = (currentPage / totalPages) * 100;
  const activeStep = currentPage - 1;

  return (
    <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Step {currentPage} of {totalPages}
        </Typography>
        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 500 }}>
          {Math.round(progressPercentage)}% Complete
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={progressPercentage} sx={{ height: 8, borderRadius: 4, mb: 3 }} />
      <Stepper activeStep={activeStep} alternativeLabel>
        {pageNames.map((label, index) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default FormProgress;
