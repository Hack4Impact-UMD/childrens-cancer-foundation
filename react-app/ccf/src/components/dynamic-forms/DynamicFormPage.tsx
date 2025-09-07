import React from 'react';
import { FormPage, FormData, FieldErrors } from '../../types/form-template-types';
import DynamicField from './DynamicField';
import FileUploadField from './FileUploadField';
import './DynamicFormPage.css';

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
  uploadedFile
}) => {
  // Group fields by sections if they have section metadata
  const groupedFields = page.fields.reduce((groups, field) => {
    const section = field.metadata?.section || 'default';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(field);
    return groups;
  }, {} as Record<string, typeof page.fields>);

  // Sort fields within each section by order
  Object.keys(groupedFields).forEach(section => {
    groupedFields[section].sort((a, b) => a.order - b.order);
  });

  const shouldShowField = (field: any): boolean => {
    if (!field.conditionalLogic) return true;

    const dependsOnValue = formData[field.conditionalLogic.dependsOn];
    const showWhen = field.conditionalLogic.showWhen;

    if (Array.isArray(showWhen)) {
      return showWhen.includes(dependsOnValue);
    } else {
      const operator = field.conditionalLogic.operator || 'equals';
      
      switch (operator) {
        case 'equals':
          return dependsOnValue === showWhen;
        case 'not_equals':
          return dependsOnValue !== showWhen;
        case 'contains':
          return Array.isArray(dependsOnValue) && dependsOnValue.includes(showWhen);
        case 'greater_than':
          return Number(dependsOnValue) > Number(showWhen);
        case 'less_than':
          return Number(dependsOnValue) < Number(showWhen);
        default:
          return dependsOnValue === showWhen;
      }
    }
  };

  const renderField = (field: any) => {
    if (!shouldShowField(field)) {
      return null;
    }

    if (field.type === 'file') {
      return (
        <FileUploadField
          key={field.id}
          field={field}
          uploadedFile={uploadedFile}
          onFileUpload={onFileUpload}
          error={fieldErrors[field.id]}
        />
      );
    }

    return (
      <DynamicField
        key={field.id}
        field={field}
        value={formData[field.id]}
        onChange={onFieldChange}
        error={fieldErrors[field.id]}
      />
    );
  };

  const renderSection = (sectionName: string, fields: any[]) => {
    const visibleFields = fields.filter(shouldShowField);
    
    if (visibleFields.length === 0) {
      return null;
    }

    return (
      <div key={sectionName} className="form-section">
        {sectionName !== 'default' && (
          <div className="section-header">
            <h3 className="section-title">{sectionName}</h3>
          </div>
        )}
        <div className="fields-grid">
          {visibleFields.map(renderField)}
        </div>
      </div>
    );
  };

  return (
    <div className="dynamic-form-page">
      <div className="page-header">
        <h2 className="page-title">{page.title}</h2>
        {page.description && (
          <p className="page-description">{page.description}</p>
        )}
        {page.metadata?.instructions && (
          <div className="page-instructions">
            <p>{page.metadata.instructions}</p>
          </div>
        )}
      </div>

      <div className="page-content">
        {Object.entries(groupedFields).map(([sectionName, fields]) =>
          renderSection(sectionName, fields)
        )}
      </div>

      {page.metadata?.completionMessage && (
        <div className="completion-message">
          <p>{page.metadata.completionMessage}</p>
        </div>
      )}
    </div>
  );
};

export default DynamicFormPage;
