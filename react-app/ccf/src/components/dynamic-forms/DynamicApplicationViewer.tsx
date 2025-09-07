import React, { useState, useEffect } from 'react';
import { DynamicApplication, FormTemplate } from '../../types/form-template-types';
import { getFormTemplate } from '../../backend/form-template-service';
import { convertToLegacyFormat } from '../../backend/dynamic-application-service';
import './DynamicApplicationViewer.css';
import { FaFileAlt, FaCalendar, FaUser, FaBuilding, FaDollarSign } from 'react-icons/fa';

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
      // This is a legacy application
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
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'status-accepted';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const renderLegacyApplication = () => {
    const legacyData = convertToLegacyFormat(application);
    
    return (
      <div className="legacy-application-view">
        <div className="application-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Project Title:</strong>
              <span>{legacyData.title || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <strong>Principal Investigator:</strong>
              <span>{legacyData.principalInvestigator || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <strong>Institution:</strong>
              <span>{legacyData.institution || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <strong>Amount Requested:</strong>
              <span>{legacyData.amountRequested || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {legacyData.institutionAddress && (
          <div className="application-section">
            <h3>Institution Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Address:</strong>
                <span>{legacyData.institutionAddress}</span>
              </div>
              {legacyData.institutionPhoneNumber && (
                <div className="info-item">
                  <strong>Phone:</strong>
                  <span>{legacyData.institutionPhoneNumber}</span>
                </div>
              )}
              {legacyData.institutionEmail && (
                <div className="info-item">
                  <strong>Email:</strong>
                  <span>{legacyData.institutionEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add more legacy fields as needed */}
      </div>
    );
  };

  const renderDynamicApplication = () => {
    if (!template) {
      return (
        <div className="error-message">
          Form template not available for this application.
        </div>
      );
    }

    return (
      <div className="dynamic-application-view">
        {template.pages.map((page, pageIndex) => (
          <div key={page.id} className="application-section">
            <h3>{page.title}</h3>
            {page.description && (
              <p className="page-description">{page.description}</p>
            )}
            
            <div className="fields-display">
              {page.fields.map(field => {
                const value = application.formData[field.id];
                
                // Skip empty optional fields
                if (!field.required && (value === undefined || value === null || value === '')) {
                  return null;
                }

                return (
                  <div key={field.id} className="field-display">
                    <div className="field-label">{field.label}</div>
                    <div className="field-value">
                      {renderFieldValue(field, value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFieldValue = (field: any, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <span className="empty-value">Not provided</span>;
    }

    switch (field.type) {
      case 'checkbox':
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : 'None selected';
        }
        return value ? 'Yes' : 'No';
        
      case 'multiselect':
        return Array.isArray(value) ? value.join(', ') : value;
        
      case 'currency':
        return `$${value}`;
        
      case 'date':
        return new Date(value).toLocaleDateString();
        
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        );
        
      case 'email':
        return (
          <a href={`mailto:${value}`}>
            {value}
          </a>
        );
        
      case 'phone':
        return (
          <a href={`tel:${value}`}>
            {value}
          </a>
        );
        
      case 'textarea':
        return (
          <div className="textarea-value">
            {value.split('\n').map((line: string, index: number) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        );
        
      case 'file':
        return (
          <div className="file-info">
            <FaFileAlt className="file-icon" />
            <span>PDF uploaded</span>
          </div>
        );
        
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="application-viewer-loading">
        <div className="loading-spinner"></div>
        <p>Loading application details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="application-viewer-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dynamic-application-viewer">
      {showHeader && (
        <div className="application-header">
          <div className="application-title-section">
            <h1>{application.title || 'Grant Application'}</h1>
            <div className="application-meta">
              <div className="meta-item">
                <FaUser className="meta-icon" />
                <span>{application.principalInvestigator || 'Unknown Investigator'}</span>
              </div>
              <div className="meta-item">
                <FaBuilding className="meta-icon" />
                <span>{application.institution || 'Unknown Institution'}</span>
              </div>
              <div className="meta-item">
                <FaDollarSign className="meta-icon" />
                <span>{application.amountRequested || 'Amount not specified'}</span>
              </div>
              <div className="meta-item">
                <FaCalendar className="meta-icon" />
                <span>Submitted {formatDate(application.submitTime)}</span>
              </div>
            </div>
          </div>
          
          <div className="application-status">
            <span className={`status-badge ${getStatusBadgeClass(application.decision)}`}>
              {application.decision.charAt(0).toUpperCase() + application.decision.slice(1)}
            </span>
            <div className="grant-type-badge">
              {application.grantType.charAt(0).toUpperCase() + application.grantType.slice(1)} Grant
            </div>
          </div>
        </div>
      )}

      <div className="application-content">
        {application.isLegacy || !application.formTemplateId ? 
          renderLegacyApplication() : 
          renderDynamicApplication()
        }
      </div>

      {showFileInfo && application.file && (
        <div className="application-section">
          <h3>Attached Documents</h3>
          <div className="file-attachment">
            <FaFileAlt className="file-icon" />
            <div className="file-details">
              <div className="file-name">{application.file}</div>
              <div className="file-description">Grant proposal document (PDF)</div>
            </div>
          </div>
        </div>
      )}

      {template && (
        <div className="template-info">
          <p>
            <strong>Form Version:</strong> {template.name} v{application.formVersion}
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicApplicationViewer;
