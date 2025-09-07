import React from 'react';
import { DynamicApplication, FormTemplate } from '../../types/form-template-types';
import { getFormTemplate } from '../../backend/form-template-service';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';

interface DynamicReviewProps {
  application: DynamicApplication;
  hideFile?: boolean;
}

const DynamicReview: React.FC<DynamicReviewProps> = ({ application, hideFile = false }) => {
  const [template, setTemplate] = React.useState<FormTemplate | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        if (application.formTemplateId) {
          const formTemplate = await getFormTemplate(application.formTemplateId);
          setTemplate(formTemplate);
        }
      } catch (error) {
        console.error('Error loading form template for review:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [application.formTemplateId]);

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const groupFieldsByPage = (template: FormTemplate, formData: Record<string, any>) => {
    const grouped: { [pageTitle: string]: { field: any; value: any }[] } = {};
    template.pages.forEach(page => {
      const fields = page.fields
        .map(field => ({ field, value: formData[field.id] }))
        .filter(({ value }) => value !== undefined && value !== null && value !== '');
      if (fields.length > 0) grouped[page.title] = fields;
    });
    return grouped;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!template) {
    return <Alert severity="error">Unable to load form template.</Alert>;
  }

  const groupedFields = groupFieldsByPage(template, application.formData);

  return (
    <Box sx={{ bgcolor: 'grey.50', p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>Application Review</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Typography variant="body2"><strong>Form Version:</strong> {application.formVersion}</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2"><strong>Submitted:</strong> {application.submitTime?.toDate().toLocaleDateString()}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {Object.entries(groupedFields).map(([pageTitle, fields]) => (
          <Grid item xs={12} key={pageTitle}>
            <Card variant="outlined">
              <CardHeader title={pageTitle} />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  {fields.map(({ field, value }) => (
                    <Grid item xs={12} sm={field.width === 'full' ? 12 : 6} key={field.id}>
                      <Typography variant="subtitle2" color="text.secondary">{field.label}</Typography>
                      <Typography>{formatFieldValue(value)}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {/* Legacy and other fields */}
      </Grid>
    </Box>
  );
};

export default DynamicReview;
