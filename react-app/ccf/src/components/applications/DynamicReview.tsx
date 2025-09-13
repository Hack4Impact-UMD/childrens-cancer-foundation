import React from 'react';
import { DynamicApplication, FormTemplate } from '../../types/form-template-types';
import { getFormTemplate } from '../../backend/form-template-service';
import { dynamicFieldsEngine, FieldInfo } from '../../services/dynamic-fields-engine';
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from '../../index';
import './DynamicReview.css';

interface DynamicReviewProps {
  application: DynamicApplication;
  hideFile?: boolean;
}

const DynamicReview: React.FC<DynamicReviewProps> = ({ application, hideFile = false }) => {
  const [template, setTemplate] = React.useState<FormTemplate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fields, setFields] = React.useState<Map<string, FieldInfo>>(new Map());
  const [fileDownloadUrls, setFileDownloadUrls] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        if (application.formTemplateId) {
          const formTemplate = await getFormTemplate(application.formTemplateId);
          setTemplate(formTemplate);
          
          // Load fields using the dynamic fields engine
          const allFields = await dynamicFieldsEngine.getAllFields();
          setFields(allFields);
          
          // Pre-generate download URLs for file fields
          const urls: Record<string, string> = {};
          for (const [fieldId, fieldInfo] of Array.from(allFields.entries())) {
            const value = application.formData?.[fieldId];
            if (value && dynamicFieldsEngine.isFileField(fieldInfo, value)) {
              try {
                const filePath = `pdfs/${value}`;
                const fileRef = ref(storage, filePath);
                const downloadUrl = await getDownloadURL(fileRef);
                urls[fieldId] = downloadUrl;
              } catch (error) {
                console.error('Error generating download URL for field:', fieldId, error);
              }
            }
          }
          setFileDownloadUrls(urls);
        }
      } catch (error) {
        console.error('Error loading form template for review:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [application.formTemplateId]);

  const handleFileClick = (fieldId: string) => {
    const downloadUrl = fileDownloadUrls[fieldId];
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      alert('File not found or unable to generate download link');
    }
  };

  const showFullText = (text: string, label: string) => {
    const newWindow = window.open('', '_blank', 'width=600,height=400');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${label}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              h1 { color: #c41230; margin-bottom: 20px; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${label}</h1>
            <div class="content">${text}</div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

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

  const getFieldLabel = (fieldId: string): string => {
    const fieldInfo = fields.get(fieldId);
    if (fieldInfo) {
      return fieldInfo.label;
    }
    // Fallback to a formatted version of the field ID
    return fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const groupFieldsByPage = (template: FormTemplate, formData: Record<string, any>) => {
    const groupedFields: { [pageTitle: string]: Array<{ fieldId: string; fieldInfo: FieldInfo; value: any }> } = {};

    template.pages.forEach(page => {
      const pageFields: Array<{ fieldId: string; fieldInfo: FieldInfo; value: any }> = [];
      
      page.fields.forEach(field => {
        const value = formData[field.id];
        const fieldInfo = fields.get(field.id);
        if (value !== undefined && value !== null && value !== '' && fieldInfo) {
          pageFields.push({ fieldId: field.id, fieldInfo, value });
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
        {Object.entries(groupedFields).map(([pageTitle, pageFields]) => (
          <div key={pageTitle} className="detail-card">
            <h3 className="card-title">{pageTitle}</h3>
            <div className="detail-grid">
              {pageFields.map(({ fieldId, fieldInfo, value }) => {
                const isFileField = dynamicFieldsEngine.isFileField(fieldInfo, value);
                const isLongTextField = dynamicFieldsEngine.isLongTextField(fieldInfo, value);
                const displayName = isFileField ? dynamicFieldsEngine.getFileDisplayName(String(value)) : null;
                
                return (
                  <div 
                    key={fieldId} 
                    className={`detail-item ${fieldInfo.type === 'textarea' ? 'full-width' : ''}`}
                  >
                    <span className="detail-label">{fieldInfo.label}</span>
                    <span className="detail-value">
                      {isFileField ? (
                        <button
                          className="file-link-btn"
                          onClick={() => handleFileClick(fieldId)}
                          title={`Open ${String(value)}`}
                        >
                          📄 {displayName}
                        </button>
                      ) : isLongTextField ? (
                        <div>
                          <div className="long-text-preview">
                            {String(value).length > 200 
                              ? `${String(value).substring(0, 200)}...` 
                              : String(value)
                            }
                          </div>
                          {String(value).length > 200 && (
                            <button
                              className="show-full-text-btn"
                              onClick={() => showFullText(String(value), fieldInfo.label)}
                            >
                              Show Full Text
                            </button>
                          )}
                        </div>
                      ) : (
                        formatFieldValue(value, fieldInfo.type)
                      )}
                    </span>
                  </div>
                );
              })}
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
