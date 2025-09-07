import React, { useState, useEffect, useRef } from 'react';
import { FormTemplate } from '../../../types/form-template-types';
import DynamicApplicationForm from '../../../components/dynamic-forms/DynamicApplicationForm';
import InteractiveFormPreview from './InteractiveFormPreview';
import { FaTimes, FaDesktop, FaTabletAlt, FaMobileAlt, FaPlay, FaEye } from 'react-icons/fa';
import './FormPreview.css';

interface FormPreviewProps {
  template: FormTemplate;
  onClose: () => void;
}

const PREVIEW_MODES = {
  STATIC: 'static',
  INTERACTIVE: 'interactive'
} as const;

type PreviewMode = (typeof PREVIEW_MODES)[keyof typeof PREVIEW_MODES];

const FormPreview: React.FC<FormPreviewProps> = ({ template, onClose }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<PreviewMode>(PREVIEW_MODES.STATIC);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isInteractiveMode = previewMode === PREVIEW_MODES.INTERACTIVE;

  const getViewportClass = () => {
    switch (viewMode) {
      case 'tablet': return 'preview-tablet';
      case 'mobile': return 'preview-mobile';
      default: return 'preview-desktop';
    }
  };

  const handleFormSubmit = (applicationId: string) => {
    // This is just a preview, so we don't actually submit
    console.log('Preview form submitted:', applicationId);
    alert('This is a preview - form submission is disabled');
  };

  // Ensure proper scroll behavior when view mode changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  // Handle keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  // Show interactive preview if selected
  if (isInteractiveMode) {
    return <InteractiveFormPreview template={template} onClose={onClose} />;
  }

  return (
    <div className="form-preview-overlay">
      <div className="form-preview-container">
        {/* Header */}
        <div className="preview-header">
          <div className="preview-title">
            <h2>Form Preview: {template.name}</h2>
            <span className="preview-version">Version {template.version}</span>
          </div>
          
          <div className="preview-controls">
            <div className="preview-mode-controls">
              <button
                onClick={() => setPreviewMode(PREVIEW_MODES.STATIC)}
                className={`mode-btn ${previewMode === PREVIEW_MODES.STATIC ? 'active' : ''}`}
                title="Static Preview"
              >
                <FaEye /> Static
              </button>
              <button
                onClick={() => setPreviewMode(PREVIEW_MODES.INTERACTIVE)}
                className={`mode-btn ${isInteractiveMode ? 'active' : ''}`}
                title="Interactive Preview"
              >
                <FaPlay /> Interactive
              </button>
            </div>
            
            <div className="viewport-controls">
              <button
                onClick={() => setViewMode('desktop')}
                className={`viewport-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                title="Desktop View"
              >
                <FaDesktop />
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`viewport-btn ${viewMode === 'tablet' ? 'active' : ''}`}
                title="Tablet View"
              >
                <FaTabletAlt />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`viewport-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                title="Mobile View"
              >
                <FaMobileAlt />
              </button>
            </div>
            
            <button onClick={onClose} className="close-preview-btn">
              <FaTimes /> Close Preview
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="preview-content">
          <div className={`preview-viewport ${getViewportClass()}`}>
            <div 
              ref={scrollContainerRef}
              className="preview-form-container" 
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* Template Info */}
              <div className="template-info-banner">
                <div className="info-content">
                  <h3>📋 Preview Mode</h3>
                  <p>
                    This is how your form will appear to applicants. 
                    Form submission is disabled in preview mode.
                  </p>
                  {template.metadata?.description && (
                    <p><strong>Description:</strong> {template.metadata.description}</p>
                  )}
                  {template.metadata?.estimatedTime && (
                    <p><strong>Estimated Time:</strong> {template.metadata.estimatedTime} minutes</p>
                  )}
                </div>
              </div>

              {/* Mock Form (Simple Preview) */}
              <div className="mock-form">
                <div className="form-header">
                  <h1>{template.name}</h1>
                  {template.metadata?.description && (
                    <p className="form-description">{template.metadata.description}</p>
                  )}
                  
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '25%' }}></div>
                  </div>
                  <div className="progress-text">Step 1 of {template.pages.length}</div>
                </div>

                {template.metadata?.instructions && (
                  <div className="form-instructions">
                    <h3>Instructions</h3>
                    <p>{template.metadata.instructions}</p>
                  </div>
                )}

                {/* Render First Page as Preview */}
                {template.pages.length > 0 && (
                  <div className="form-page">
                    <h2>{template.pages[0].title}</h2>
                    {template.pages[0].description && (
                      <p className="page-description">{template.pages[0].description}</p>
                    )}
                    
                    <div className="fields-preview">
                      {template.pages[0].fields
                        .sort((a, b) => a.order - b.order)
                        .slice(0, 5) // Show only first 5 fields
                        .map(field => (
                        <div key={field.id} className={`field-preview field-${field.width || 'full'}`}>
                          <label className="field-label">
                            {field.label}
                            {field.required && <span className="required">*</span>}
                          </label>
                          
                          {field.helpText && (
                            <div className="field-help">{field.helpText}</div>
                          )}
                          
                          <div className="field-input-preview">
                            {field.type === 'textarea' && (
                              <textarea 
                                placeholder={field.placeholder} 
                                disabled 
                                className="preview-input"
                                rows={3}
                              />
                            )}
                            {field.type === 'select' && (
                              <select disabled className="preview-input">
                                <option>{field.placeholder || 'Select an option...'}</option>
                                {field.options?.slice(0, 3).map((option, idx) => (
                                  <option key={idx}>{option}</option>
                                ))}
                              </select>
                            )}
                            {field.type === 'radio' && (
                              <div className="radio-preview">
                                {field.options?.slice(0, 3).map((option, idx) => (
                                  <label key={idx} className="radio-option">
                                    <input type="radio" disabled />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            )}
                            {field.type === 'checkbox' && field.options && field.options.length > 1 && (
                              <div className="checkbox-preview">
                                {field.options.slice(0, 3).map((option, idx) => (
                                  <label key={idx} className="checkbox-option">
                                    <input type="checkbox" disabled />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            )}
                            {field.type === 'file' && (
                              <div className="file-upload-preview">
                                <div className="upload-area">
                                  📎 Click to upload or drag and drop<br/>
                                  <small>PDF files only, up to 10MB</small>
                                </div>
                              </div>
                            )}
                            {!['textarea', 'select', 'radio', 'checkbox', 'file'].includes(field.type) && (
                              <input 
                                type={field.type === 'currency' ? 'text' : field.type}
                                placeholder={field.placeholder} 
                                disabled 
                                className="preview-input"
                              />
                            )}
                          </div>
                          
                          {field.validation && (
                            <div className="validation-info">
                              {field.validation.required && <span className="validation-rule">Required</span>}
                              {field.validation.minLength && <span className="validation-rule">Min: {field.validation.minLength}</span>}
                              {field.validation.maxLength && <span className="validation-rule">Max: {field.validation.maxLength}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {template.pages[0].fields.length > 5 && (
                        <div className="more-fields-indicator">
                          ... and {template.pages[0].fields.length - 5} more fields
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Show other pages summary */}
                {template.pages.length > 1 && (
                  <div className="other-pages-summary">
                    <h3>Additional Pages:</h3>
                    <ul>
                      {template.pages.slice(1).map((page, idx) => (
                        <li key={page.id}>
                          <strong>{page.title}</strong> ({page.fields.length} fields)
                          {page.description && <div className="summary-description">{page.description}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mock Navigation */}
                <div className="form-navigation-preview">
                  <button className="nav-btn secondary" disabled>← Back</button>
                  <button className="nav-btn primary" disabled>Continue →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
