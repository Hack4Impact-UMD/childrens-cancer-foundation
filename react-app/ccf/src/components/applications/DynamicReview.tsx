import React from 'react';
import { DynamicApplication, FormTemplate } from '../../types/form-template-types';
import { getFormTemplate } from '../../backend/form-template-service';
import './DynamicReview.css';

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

  const formatFieldValue = (value: any, fieldType: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const getFieldLabel = (fieldId: string, template: FormTemplate): string => {
    // Find the field in the template
    for (const page of template.pages) {
      const field = page.fields.find(f => f.id === fieldId);
      if (field) {
        return field.label;
      }
    }
    // Fallback to a formatted version of the field ID
    return fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const groupFieldsByPage = (template: FormTemplate, formData: Record<string, any>) => {
    const groupedFields: { [pageTitle: string]: Array<{ field: any; value: any }> } = {};

    template.pages.forEach(page => {
      const pageFields: Array<{ field: any; value: any }> = [];
      
      page.fields.forEach(field => {
        const value = formData[field.id];
        if (value !== undefined && value !== null && value !== '') {
          pageFields.push({ field, value });
        }
      });

      if (pageFields.length > 0) {
        groupedFields[page.title] = pageFields;
      }
    });

    return groupedFields;
  };

  if (loading) {
    return (
      <div className="dynamic-review-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="dynamic-review-container">
        <div className="error-container">
          <h3>Unable to load form template</h3>
          <p>The form template for this application could not be loaded.</p>
        </div>
      </div>
    );
  }

  const groupedFields = groupFieldsByPage(template, application.formData);

  return (
    <div className="dynamic-review-container">
      <div className="review-header">
        <h2>Application Review</h2>
        <div className="application-meta">
          <span className="meta-item">
            <strong>Form Version:</strong> {application.formVersion}
          </span>
          <span className="meta-item">
            <strong>Submitted:</strong> {application.submitTime?.toDate().toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="review-content">
        {Object.entries(groupedFields).map(([pageTitle, fields]) => (
          <div key={pageTitle} className="detail-card">
            <h3 className="card-title">{pageTitle}</h3>
            <div className="detail-grid">
              {fields.map(({ field, value }) => (
                <div 
                  key={field.id} 
                  className={`detail-item ${field.width === 'full' ? 'full-width' : ''}`}
                >
                  <span className="detail-label">{field.label}</span>
                  <span className="detail-value">
                    {formatFieldValue(value, field.type)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Legacy fields for backward compatibility */}
        {(application.title || application.institution || application.amountRequested) && (
          <div className="detail-card">
            <h3 className="card-title">Application Summary</h3>
            <div className="detail-grid">
              {application.title && (
                <div className="detail-item full-width">
                  <span className="detail-label">Title</span>
                  <span className="detail-value">{application.title}</span>
                </div>
              )}
              {application.institution && (
                <div className="detail-item">
                  <span className="detail-label">Institution</span>
                  <span className="detail-value">{application.institution}</span>
                </div>
              )}
              {application.amountRequested && (
                <div className="detail-item">
                  <span className="detail-label">Amount Requested</span>
                  <span className="detail-value">{application.amountRequested}</span>
                </div>
              )}
              {application.principalInvestigator && (
                <div className="detail-item">
                  <span className="detail-label">Principal Investigator</span>
                  <span className="detail-value">{application.principalInvestigator}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!hideFile && application.file && (
          <div className="detail-card">
            <h3 className="card-title">Attachments</h3>
            <div className="detail-item">
              <span className="detail-label">File</span>
              <span className="detail-value">{application.file}</span>
            </div>
          </div>
        )}

        {/* Show if this is a legacy application */}
        {application.isLegacy && (
          <div className="detail-card legacy-notice">
            <h3 className="card-title">Legacy Application</h3>
            <p>This application was submitted using the previous form system.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicReview;
