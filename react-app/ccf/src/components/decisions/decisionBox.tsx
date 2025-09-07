import { Decision } from '../../types/decision-types';
import { firstLetterCap } from '../../utils/stringfuncs';
import { useEffect, useState } from 'react';
// import Confetti from "react-confetti";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

export const DecisionBox = ({ decision }: { decision: Decision }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (decision.isAccepted === true) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [decision.isAccepted]);

  const getDecisionStatus = () => {
    if (decision.isAccepted === true) {
      return 'accepted';
    } else {
      return 'rejected';
    }
  };

  const getStatusColor = () => {
    const status = getDecisionStatus();
    switch (status) {
      case 'accepted':
        return '#22c55e'; // green
      case 'rejected':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const status = getDecisionStatus();
  const navigate = useNavigate();

  const goToResults = () => {
    navigate('/applicant/results', { state: { decision } });
  };

  return (
    <>
      {/* {showConfetti &&
        <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={200}
        />} */}
      <Card sx={{ mt: 3, p: 2, background: 'transparent' }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" component="h3" sx={{ color: 'black', fontWeight: 600, mb: 2 }}>
              Decision Status
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                py: 2,
                px: 4,
                borderRadius: '50px',
                fontWeight: 700,
                fontSize: '1.25rem',
                boxShadow: 3,
                border: '3px solid rgba(255, 255, 255, 0.3)',
                bgcolor: getStatusColor(),
                color: 'white',
              }}
            >
              {firstLetterCap(status)}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {decision.isAccepted && (
              <Card variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 3, borderColor: 'grey.300' }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'grey.600', mb: 1.5, textTransform: 'uppercase' }}>
                  Funding Decision
                </Typography>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  {formatCurrency(decision.fundingAmount || 0)}
                </Typography>
                {status === 'accepted' && decision.fundingAmount && decision.fundingAmount > 0 && (
                  <Typography sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.95rem' }}>
                    Congratulations! Your funding has been approved.
                  </Typography>
                )}
              </Card>
            )}

            {decision.comments && (
              <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'grey.300' }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'grey.600', mb: 1, textTransform: 'uppercase' }}>
                  Additional Comments
                </Typography>
                <Typography sx={{ color: 'text.secondary', lineHeight: 1.7, fontSize: '1rem', fontStyle: 'italic' }}>
                  {decision.comments}
                </Typography>
              </Card>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button onClick={goToResults} variant="contained" sx={{ py: 1.5, px: 4 }}>
                Go to Results
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};