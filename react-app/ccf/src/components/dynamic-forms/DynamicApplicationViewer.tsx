import React, { useState, useEffect } from 'react';
import { DynamicApplication, FormTemplate, FormField } from '../../types/form-template-types';
import { getFormTemplate } from '../../backend/form-template-service';
import { convertToLegacyFormat } from '../../backend/dynamic-application-service';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Link,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';
import { FaFileAlt, FaCalendar, FaUser, FaBuilding, FaDollarSign } from 'react-icons/fa';

// ... (interfaces and other imports)
interface DynamicApplicationViewerProps {
    application: DynamicApplication;
    showHeader?: boolean;
    showFileInfo?: boolean;
  }

  const DynamicApplicationViewer: React.FC<DynamicApplicationViewerProps> = ({
    application,
    showHeader = true,
    showFileInfo = true
  }) => {
    const [template, setTemplate] = useState<FormTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      loadFormTemplate();
    }, [application.formTemplateId]);

    const loadFormTemplate = async () => {
      if (!application.formTemplateId) {
        setTemplate(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetchedTemplate = await getFormTemplate(application.formTemplateId);
        setTemplate(fetchedTemplate);
      } catch (error) {
        console.error('Error loading form template:', error);
        setError('Failed to load form template');
      } finally {
        setLoading(false);
      }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      };

    const getStatusChipColor = (status: string) => {
      switch (status) {
        case 'accepted': return 'success';
        case 'rejected': return 'error';
        default: return 'warning';
      }
    };

    const renderFieldValue = (field: FormField, value: any) => {
      if (value === undefined || value === null || value === '') {
        return <Typography color="text.secondary" fontStyle="italic">Not provided</Typography>;
      }
      switch (field.type) {
        case 'checkbox':
          return <Typography>{Array.isArray(value) ? value.join(', ') : (value ? 'Yes' : 'No')}</Typography>;
        case 'multiselect':
          return <Typography>{Array.isArray(value) ? value.join(', ') : value}</Typography>;
        case 'currency':
          return <Typography>${value}</Typography>;
        case 'date':
          return <Typography>{new Date(value).toLocaleDateString()}</Typography>;
        case 'url':
          return <Link href={value} target="_blank" rel="noopener noreferrer">{value}</Link>;
        case 'email':
          return <Link href={`mailto:${value}`}>{value}</Link>;
        case 'phone':
          return <Link href={`tel:${value}`}>{value}</Link>;
        case 'textarea':
          return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>;
        case 'file':
          return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FaFileAlt /><Typography>PDF uploaded</Typography></Box>;
        default:
          return <Typography>{String(value)}</Typography>;
      }
    };

    const renderDynamicApplication = () => (
      <Grid container spacing={3}>
        {template?.pages.map((page) => (
          <Grid item xs={12} key={page.id}>
            <Card variant="outlined">
              <CardHeader title={page.title} />
              <Divider />
              <CardContent>
                {page.description && <Typography color="text.secondary" paragraph>{page.description}</Typography>}
                <Grid container spacing={2}>
                  {page.fields.map((field) => {
                    const value = application.formData[field.id];
                    if (!field.required && (value === undefined || value === null || value === '')) return null;
                    return (
                      <Grid item xs={12} md={6} key={field.id}>
                        <Typography variant="subtitle2" color="text.secondary">{field.label}</Typography>
                        {renderFieldValue(field, value)}
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        {showHeader && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>{application.title || 'Grant Application'}</Typography>
              <Grid container spacing={2}>
                <Grid item><FaUser /><Typography variant="body2">{application.principalInvestigator || 'N/A'}</Typography></Grid>
                <Grid item><FaBuilding /><Typography variant="body2">{application.institution || 'N/A'}</Typography></Grid>
                <Grid item><FaDollarSign /><Typography variant="body2">{application.amountRequested || 'N/A'}</Typography></Grid>
                <Grid item><FaCalendar /><Typography variant="body2">Submitted {formatDate(application.submitTime)}</Typography></Grid>
              </Grid>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip label={application.decision} color={getStatusChipColor(application.decision)} size="small" />
              <Chip label={`${application.grantType} Grant`} size="small" sx={{ mt: 1 }} />
            </Box>
          </Box>
        )}

        {application.isLegacy || !application.formTemplateId ? <Alert severity="warning">Legacy application data</Alert> : renderDynamicApplication()}

        {showFileInfo && application.file && (
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardHeader title="Attached Documents" />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FaFileAlt size="2em" />
                <Box>
                  <Typography variant="body1">{application.file}</Typography>
                  <Typography variant="body2" color="text.secondary">Grant proposal document (PDF)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {template && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <strong>Form Version:</strong> {template.name} v{application.formVersion}
          </Alert>
        )}
      </Paper>
    );
  };

  export default DynamicApplicationViewer;
