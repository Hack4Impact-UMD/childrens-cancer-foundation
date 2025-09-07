import React, { useState, useEffect, useRef } from 'react';
import { FormTemplate, FormField } from '../../../types/form-template-types';
import { FaTimes, FaDesktop, FaTabletAlt, FaMobileAlt, FaArrowLeft, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import './InteractiveFormPreview.css';

interface InteractiveFormPreviewProps {
  template: FormTemplate;
  onClose: () => void;
}

const InteractiveFormPreview: React.FC<InteractiveFormPreviewProps> = ({ template, onClose }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentPage = template.pages[currentPageIndex];
  const totalPages = template.pages.length;
  const isLastPage = currentPageIndex === totalPages - 1;
  const isFirstPage = currentPageIndex === 0;

  // Reset scroll position when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPageIndex, viewMode]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && !isFirstPage) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && !isLastPage) {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentPageIndex, isFirstPage, isLastPage]);

  const getViewportClass = () => {
    switch (viewMode) {
      case 'tablet': return 'preview-tablet';
      case 'mobile': return 'preview-mobile';
      default: return 'preview-desktop';
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateCurrentPage = (): boolean => {
    const pageErrors: Record<string, string> = {};
    let isValid = true;

    currentPage.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          pageErrors[field.id] = `${field.label} is required`;
          isValid = false;
        }
      }

      // Additional validation based on field type
      if (formData[field.id]) {
        const value = formData[field.id];
        if (field.validation) {
          if (field.validation.minLength && value.length < field.validation.minLength) {
            pageErrors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
            isValid = false;
          }
          if (field.validation.maxLength && value.length > field.validation.maxLength) {
            pageErrors[field.id] = `${field.label} must be no more than ${field.validation.maxLength} characters`;
            isValid = false;
          }
          if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            pageErrors[field.id] = 'Please enter a valid email address';
            isValid = false;
          }
        }
      }
    });

    setErrors(pageErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentPage() && currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (validateCurrentPage()) {
      alert(`✅ Form submitted successfully!\n\nThis is a preview - no data was actually saved.\n\nForm Data:\n${JSON.stringify(formData, null, 2)}`);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    const commonProps = {
      id: field.id,
      className: `field-input ${error ? 'error' : ''}`,
      placeholder: field.placeholder,
      required: field.required,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleFieldChange(field.id, e.target.value)
    };

    return (
      <div key={field.id} className={`form-field field-${field.width || 'full'}`}>
        <label htmlFor={field.id} className="field-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
        
        {field.helpText && (
          <div className="field-help">{field.helpText}</div>
        )}
        
        <div className="field-input-container">
          {field.type === 'textarea' && (
            <textarea 
              {...commonProps}
              value={value}
              rows={4}
            />
          )}
          
          {field.type === 'select' && (
            <select {...commonProps} value={value}>
              <option value="">{field.placeholder || 'Select an option...'}</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          )}
          
          {field.type === 'radio' && field.options && (
            <div className="radio-group">
              {field.options.map((option, idx) => (
                <label key={idx} className="radio-option">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {field.type === 'checkbox' && field.options && field.options.length > 1 && (
            <div className="checkbox-group">
              {field.options.map((option, idx) => (
                <label key={idx} className="checkbox-option">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(value || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      handleFieldChange(field.id, newValues);
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {field.type === 'checkbox' && field.options && field.options.length === 1 && (
            <label className="single-checkbox">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              />
              <span>{field.options[0]}</span>
            </label>
          )}
          
          {field.type === 'file' && (
            <div className="file-upload">
              <input
                type="file"
                {...commonProps}
                onChange={(e) => handleFieldChange(field.id, e.target.files?.[0]?.name || '')}
                className="file-input"
              />
              <div className="file-upload-area">
                <div className="file-icon">📎</div>
                <div>Click to upload or drag and drop</div>
                <small>Accepted file types: PDF, DOC, DOCX</small>
              </div>
            </div>
          )}
          
          {!['textarea', 'select', 'radio', 'checkbox', 'file'].includes(field.type) && (
            <input 
              {...commonProps}
              type={field.type === 'currency' ? 'text' : field.type}
              value={value}
            />
          )}
        </div>
        
        {error && (
          <div className="field-error">{error}</div>
        )}
      </div>
    );
  };

  return (
    <div className="interactive-preview-overlay">
      <div className="interactive-preview-container">
        {/* Header */}
        <div className="preview-header">
          <div className="preview-title">
            <h2>Interactive Preview: {template.name}</h2>
            <span className="preview-version">Version {template.version}</span>
          </div>
          
          <div className="preview-controls">
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
              {/* Form Header */}
              <div className="form-header">
                <h1>{template.name}</h1>
                {template.metadata?.description && (
                  <p className="form-description">{template.metadata.description}</p>
                )}
                
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${((currentPageIndex + 1) / totalPages) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    Step {currentPageIndex + 1} of {totalPages}: {currentPage.title}
                  </div>
                </div>
              </div>

              {/* Current Page */}
              <div className="current-page">
                <div className="page-header">
                  <h2>{currentPage.title}</h2>
                  {currentPage.description && (
                    <p className="page-description">{currentPage.description}</p>
                  )}
                  {currentPage.metadata?.instructions && (
                    <div className="page-instructions">
                      <strong>Instructions:</strong> {currentPage.metadata.instructions}
                    </div>
                  )}
                </div>

                <div className="page-fields">
                  {currentPage.fields
                    .sort((a, b) => a.order - b.order)
                    .map(renderField)}
                </div>
              </div>

              {/* Navigation */}
              <div className="form-navigation">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstPage}
                  className="nav-btn secondary"
                >
                  <FaArrowLeft /> Previous
                </button>
                
                <div className="page-indicator">
                  {template.pages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPageIndex(index)}
                      className={`page-dot ${index === currentPageIndex ? 'active' : ''} ${index < currentPageIndex ? 'completed' : ''}`}
                      title={`Go to ${template.pages[index].title}`}
                    >
                      {index < currentPageIndex ? <FaCheckCircle /> : index + 1}
                    </button>
                  ))}
                </div>
                
                {isLastPage ? (
                  <button
                    onClick={handleSubmit}
                    className="nav-btn primary"
                  >
                    <FaCheckCircle /> Submit Application
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="nav-btn primary"
                  >
                    Continue <FaArrowRight />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveFormPreview;
