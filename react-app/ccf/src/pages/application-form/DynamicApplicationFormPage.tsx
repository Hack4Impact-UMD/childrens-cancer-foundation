import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GrantType } from '../../types/form-template-types';
import DynamicApplicationForm from '../../components/dynamic-forms/DynamicApplicationForm';

const DynamicApplicationFormPage: React.FC = () => {
  const { grantType } = useParams<{ grantType: string }>();
  const navigate = useNavigate();

  // Validate grant type
  const validGrantTypes: GrantType[] = ['research', 'nextgen', 'nonresearch'];
  const normalizedGrantType = grantType?.toLowerCase() as GrantType;

  if (!grantType || !validGrantTypes.includes(normalizedGrantType)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Invalid Grant Type</h2>
        <p>The grant type "{grantType}" is not valid.</p>
        <button onClick={() => navigate('/applicant/dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleSubmissionComplete = (applicationId: string) => {
    // Redirect to dashboard with success message
    navigate('/applicant/dashboard', { 
      state: { 
        message: 'Application submitted successfully!',
        applicationId 
      }
    });
  };

  return (
    <DynamicApplicationForm
      grantType={normalizedGrantType}
      onSubmit={handleSubmissionComplete}
    />
  );
};

export default DynamicApplicationFormPage;
