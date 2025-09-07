import React from 'react';
import { FormPage, FormData, FieldErrors, FormField } from '../../types/form-template-types';
import DynamicField from './DynamicField';
import FileUploadField from './FileUploadField';
import { Box, Typography, Card, CardContent, CardHeader, Grid, Alert } from '@mui/material';

interface DynamicFormPageProps {
  page: FormPage;
  formData: FormData;
  fieldErrors: FieldErrors;
  onFieldChange: (fieldId: string, value: any) => void;
  onFileUpload: (file: File | null) => void;
  uploadedFile: File | null;
}

const DynamicFormPage: React.FC<DynamicFormPageProps> = ({
  page,
  formData,
  fieldErrors,
  onFieldChange,
  onFileUpload,
  uploadedFile,
}) => {
  const groupedFields = page.fields.reduce((groups, field) => {
    const section = field.metadata?.section || 'default';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(field);
    return groups;
  }, {} as Record<string, FormField[]>);

  Object.keys(groupedFields).forEach((section) => {
    groupedFields[section].sort((a, b) => a.order - b.order);
  });

  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditionalLogic) return true;
    const dependsOnValue = formData[field.conditionalLogic.dependsOn];
    const { showWhen, operator = 'equals' } = field.conditionalLogic;

    if (Array.isArray(showWhen)) {
      return showWhen.includes(dependsOnValue);
    }
    switch (operator) {
      case 'equals': return dependsOnValue === showWhen;
      case 'not_equals': return dependsOnValue !== showWhen;
      case 'contains': return Array.isArray(dependsOnValue) && dependsOnValue.includes(showWhen as string);
      case 'greater_than': return Number(dependsOnValue) > Number(showWhen);
      case 'less_than': return Number(dependsOnValue) < Number(showWhen);
      default: return dependsOnValue === showWhen;
    }
  };

  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null;

    if (field.type === 'file') {
      return (
        <Grid item xs={12} sm={field.width === 'half' ? 6 : 12} key={field.id}>
          <FileUploadField
            field={field}
            uploadedFile={uploadedFile}
            onFileUpload={onFileUpload}
            error={fieldErrors[field.id]}
          />
        </Grid>
      );
    }
    return (
      <Grid item xs={12} sm={field.width === 'half' ? 6 : 12} key={field.id}>
        <DynamicField
          field={field}
          value={formData[field.id]}
          onChange={onFieldChange}
          error={fieldErrors[field.id]}
        />
      </Grid>
    );
  };

  const renderSection = (sectionName: string, fields: FormField[]) => {
    const visibleFields = fields.filter(shouldShowField);
    if (visibleFields.length === 0) return null;

    return (
      <Box key={sectionName} sx={{ mb: 4 }}>
        {sectionName !== 'default' && (
          <CardHeader title={<Typography variant="h5" component="h3">{sectionName}</Typography>} sx={{ pb: 2 }} />
        )}
        <Grid container spacing={2}>
          {visibleFields.map(renderField)}
        </Grid>
      </Box>
    );
  };

  return (
    <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            {page.title}
          </Typography>
          {page.description && <Typography color="text.secondary" paragraph>{page.description}</Typography>}
          {page.metadata?.instructions && <Alert severity="info">{page.metadata.instructions}</Alert>}
        </Box>

        {Object.entries(groupedFields).map(([sectionName, fields]) => renderSection(sectionName, fields))}

        {page.metadata?.completionMessage && <Alert severity="success">{page.metadata.completionMessage}</Alert>}
      </CardContent>
    </Card>
  );
};

export default DynamicFormPage;
