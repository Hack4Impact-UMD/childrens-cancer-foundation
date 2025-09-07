import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormTemplate, FormData, FieldErrors, GrantType } from '../../types/form-template-types';
import { getActiveFormTemplate } from '../../backend/form-template-service';
import { submitDynamicApplication, validateApplicationData } from '../../backend/dynamic-application-service';
import { getCurrentCycle } from '../../backend/application-cycle';
import { 
  saveApplicationState, 
  checkFormVersionCompatibility,
  resetApplicationState,
  markApplicationSubmitted
} from '../../backend/application-state-service';
import { auth } from '../../index';
import DynamicFormPage from './DynamicFormPage';
import FormProgress from './FormProgress';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Container,
  Paper,
  Alert,
  Modal,
} from '@mui/material';

// ... (rest of the imports)

const DynamicApplicationForm: React.FC<{ grantType: GrantType; onSubmit?: (applicationId: string) => void; }> = ({
  grantType,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [showVersionResetModal, setShowVersionResetModal] = useState(false);
  const [versionResetReason, setVersionResetReason] = useState('');

  // ... (useEffect and other functions remain largely the same, just UI parts will change)
  useEffect(() => {
    loadFormTemplate();
    checkApplicationStatus();
  }, [grantType]);

  const loadFormTemplate = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser?.uid;
      if (!currentUser) {
        toast.error('Please log in to access the application form');
        navigate('/applicant/dashboard');
        return;
      }

      // Check form version compatibility first
      const compatibilityCheck = await checkFormVersionCompatibility(currentUser, grantType);
      
      if (compatibilityCheck.needsReset) {
        setVersionResetReason(compatibilityCheck.reason || 'Form has been updated');
        setShowVersionResetModal(true);
        
        // Reset the application state
        await resetApplicationState(currentUser, grantType);
        
        // Load the new template
        if (compatibilityCheck.activeTemplate) {
          setTemplate(compatibilityCheck.activeTemplate);
          initializeFormData(compatibilityCheck.activeTemplate);
        } else {
          const activeTemplate = await getActiveFormTemplate(grantType);
          if (!activeTemplate) {
            // No dynamic template available, redirect to static form
            console.log(`No dynamic template found for ${grantType}, redirecting to static form`);
            navigate(`/applicant/application-form/${grantType}`);
            return;
          }
          setTemplate(activeTemplate);
          initializeFormData(activeTemplate);
        }
      } else {
        // Load template normally
        const activeTemplate = await getActiveFormTemplate(grantType);
        
        if (!activeTemplate) {
          // No dynamic template available, redirect to static form
          console.log(`No dynamic template found for ${grantType}, redirecting to static form`);
          navigate(`/applicant/application-form/${grantType}`);
          return;
        }

        setTemplate(activeTemplate);
        
        // Check for existing draft
        if (compatibilityCheck.currentState) {
          setFormData(compatibilityCheck.currentState.formData);
          setCurrentPageIndex(compatibilityCheck.currentState.currentPageIndex);
          setHasExistingDraft(true);
          toast.info('Resuming your draft application');
        } else {
          initializeFormData(activeTemplate);
        }
      }
    } catch (error) {
      console.error('Error loading form template:', error);
      toast.error('Failed to load application form');
      navigate('/applicant/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = (template: FormTemplate) => {
    const initialData: FormData = {};
    template.pages.forEach(page => {
      page.fields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'multiselect') {
          initialData[field.id] = [];
        } else {
          initialData[field.id] = '';
        }
      });
    });
    setFormData(initialData);
    setCurrentPageIndex(0);
    setHasExistingDraft(false);
  };

  const checkApplicationStatus = async () => {
    try {
      const cycle = await getCurrentCycle();
      setApplicationOpen(cycle.stage === "Applications Open");
    } catch (error) {
      console.error('Error checking application status:', error);
      setApplicationOpen(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (!template || !auth.currentUser?.uid) return;
      
      try {
        await saveApplicationState(
          auth.currentUser.uid,
          grantType,
          template.id,
          template.version,
          formData,
          currentPageIndex,
          (await getCurrentCycle()).name
        );
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    // Auto-save after 2 seconds of inactivity
    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [formData, currentPageIndex, template, grantType]);

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
    
    // If there's a file field in the form, update its value
    if (template) {
      const fileField = template.pages
        .flatMap(page => page.fields)
        .find(field => field.type === 'file');
      
      if (fileField) {
        handleFieldChange(fileField.id, file);
      }
    }
  };

  const validateCurrentPage = (): boolean => {
    if (!template) return false;

    const currentPage = template.pages[currentPageIndex];
    const errors: FieldErrors = {};
    let isValid = true;

    currentPage.fields.forEach(field => {
      const value = formData[field.id];
      
      // Required field validation
      if (field.required && (value === undefined || value === null || value === '')) {
        errors[field.id] = `${field.label} is required`;
        isValid = false;
        return;
      }

      // Skip further validation if field is empty and not required
      if (!field.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type-specific validation
      if (field.validation) {
        const validation = field.validation;
        
        // String length validation
        if (typeof value === 'string') {
          if (validation.minLength && value.length < validation.minLength) {
            errors[field.id] = `${field.label} must be at least ${validation.minLength} characters`;
            isValid = false;
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            errors[field.id] = `${field.label} must be no more than ${validation.maxLength} characters`;
            isValid = false;
          }
        }

        // Number validation
        if (field.type === 'number' && typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            errors[field.id] = `${field.label} must be at least ${validation.min}`;
            isValid = false;
          }
          if (validation.max !== undefined && value > validation.max) {
            errors[field.id] = `${field.label} must be no more than ${validation.max}`;
            isValid = false;
          }
        }

        // Pattern validation
        if (validation.pattern && typeof value === 'string') {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors[field.id] = validation.customMessage || `${field.label} format is invalid`;
            isValid = false;
          }
        }
      }

      // Email validation
      if (field.type === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field.id] = `${field.label} must be a valid email address`;
          isValid = false;
        }
      }

      // URL validation
      if (field.type === 'url' && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          errors[field.id] = `${field.label} must be a valid URL`;
          isValid = false;
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleNextPage = () => {
    if (!validateCurrentPage()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    if (template && currentPageIndex < template.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!template) return;

    // Validate all form data
    const validation = validateApplicationData(formData, template);
    if (!validation.isValid) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    if (!uploadedFile) {
      toast.error('Please upload the required PDF file');
      return;
    }

    setSubmitting(true);

    try {
      // Get current user ID and application cycle
      const currentUser = auth.currentUser?.uid;
      if (!currentUser) {
        toast.error('Please log in to submit an application');
        return;
      }
      const cycle = await getCurrentCycle();

      const applicationId = await submitDynamicApplication(
        template.id,
        formData,
        uploadedFile,
        currentUser,
        cycle.name
      );

      // Mark application state as submitted
      await markApplicationSubmitted(currentUser, grantType, applicationId);

      toast.success('Application submitted successfully!');
      
      if (onSubmit) {
        onSubmit(applicationId);
      } else {
        navigate('/applicant/dashboard');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentPageIndex > 0) {
      handlePreviousPage();
    } else {
      navigate('/applicant/dashboard');
    }
  };

  const handleVersionResetConfirm = () => {
    setShowVersionResetModal(false);
    toast.info('Form has been reset due to admin changes. Please start fresh.');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading application form...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!template || !applicationOpen) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            { !template ? 'Form Not Available' : 'Applications Closed' }
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            { !template ? `The application form for ${grantType} grants is not currently available.` : `Applications for ${grantType} grants are currently closed.`}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/applicant/dashboard')}>
            Return to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  const currentPage = template.pages[currentPageIndex];
  const isLastPage = currentPageIndex === template.pages.length - 1;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Modal open={showVersionResetModal} onClose={handleVersionResetConfirm}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4,
        }}>
          <Typography variant="h6" component="h2">Form Updated</Typography>
          <Typography sx={{ mt: 2 }}>
            The application form has been updated by an administrator.
            <strong>Reason:</strong> {versionResetReason}
            Your previous progress has been reset.
          </Typography>
          <Button onClick={handleVersionResetConfirm} sx={{ mt: 2 }}>Continue</Button>
        </Box>
      </Modal>

      <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h4" gutterBottom>{template.name}</Typography>
        {template.metadata?.description && <Typography color="text.secondary">{template.metadata.description}</Typography>}
        {hasExistingDraft && <Alert severity="info" sx={{ mt: 2 }}>📝 Resuming your draft application</Alert>}
        <FormProgress
          currentPage={currentPageIndex + 1}
          totalPages={template.pages.length}
          pageNames={template.pages.map((page) => page.title)}
        />
      </Paper>

      {template.metadata?.instructions && <Alert severity="info" sx={{ mb: 4 }}>{template.metadata.instructions}</Alert>}

      <DynamicFormPage
        page={currentPage}
        formData={formData}
        fieldErrors={fieldErrors}
        onFieldChange={handleFieldChange}
        onFileUpload={handleFileUpload}
        uploadedFile={uploadedFile}
      />

      <Paper sx={{ p: 2, mt: 4, position: 'sticky', bottom: 16, zIndex: 1000 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={goBack}>
            {currentPageIndex === 0 ? 'Back to Dashboard' : 'Previous'}
          </Button>
          {!isLastPage ? (
            <Button variant="contained" onClick={handleNextPage}>Continue</Button>
          ) : (
            <Button variant="contained" color="success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Submit Application'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default DynamicApplicationForm;
