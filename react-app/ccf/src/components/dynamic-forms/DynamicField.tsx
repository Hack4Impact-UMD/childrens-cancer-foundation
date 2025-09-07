import React from 'react';
import { FormField, DynamicFieldProps } from '../../types/form-template-types';
import './DynamicField.css';

const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false
}) => {
  const handleChange = (newValue: any) => {
    onChange(field.id, newValue);
  };

  const formatCurrency = (amount: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = amount.replace(/[^0-9.]/g, '');
    
    // Parse as float and format with commas
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    handleChange(formatted);
  };

  const renderField = () => {
    const commonProps = {
      id: field.id,
      disabled,
      className: error ? 'field-input error' : 'field-input'
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            {...commonProps}
            type="text"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={field.validation?.maxLength}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            maxLength={field.validation?.maxLength}
            className={error ? 'field-textarea error' : 'field-textarea'}
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(parseFloat(e.target.value) || '')}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'email':
        return (
          <input
            {...commonProps}
            type="email"
            value={value || ''}
            placeholder={field.placeholder || 'Enter email address'}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'phone':
        return (
          <input
            {...commonProps}
            type="tel"
            value={value || ''}
            placeholder={field.placeholder || '(123) 456-7890'}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'url':
        return (
          <input
            {...commonProps}
            type="url"
            value={value || ''}
            placeholder={field.placeholder || 'https://example.com'}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'currency':
        return (
          <div className="currency-input-wrapper">
            <span className="currency-symbol">$</span>
            <input
              {...commonProps}
              type="text"
              value={value || ''}
              placeholder={field.placeholder || '0.00'}
              onChange={handleCurrencyChange}
              className={`currency-input ${error ? 'error' : ''}`}
            />
          </div>
        );

      case 'select':
        return (
          <select
            {...commonProps}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'field-select error' : 'field-select'}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option, index) => (
              <label key={index} className="radio-option">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={disabled}
                />
                <span className="radio-label">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        if (field.options && field.options.length > 1) {
          // Multiple checkboxes
          return (
            <div className="checkbox-group">
              {field.options.map((option, index) => (
                <label key={index} className="checkbox-option">
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(value) ? value.includes(option) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleChange([...currentValues, option]);
                      } else {
                        handleChange(currentValues.filter(v => v !== option));
                      }
                    }}
                    disabled={disabled}
                  />
                  <span className="checkbox-label">{option}</span>
                </label>
              ))}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <label className="checkbox-single">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled}
              />
              <span className="checkbox-label">
                {field.options?.[0] || field.label}
              </span>
            </label>
          );
        }

      case 'multiselect':
        return (
          <div className="multiselect-wrapper">
            <select
              {...commonProps}
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                handleChange(selectedValues);
              }}
              className={error ? 'field-multiselect error' : 'field-multiselect'}
              size={Math.min(field.options?.length || 5, 8)}
            >
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="multiselect-help">
              Hold Ctrl (Cmd on Mac) to select multiple options
            </div>
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className={`dynamic-field field-${field.width || 'full'}`}>
      <label htmlFor={field.id} className="field-label">
        {field.label}
        {field.required && <span className="required-indicator">*</span>}
      </label>
      
      {field.helpText && (
        <div className="field-help">
          {field.helpText}
        </div>
      )}
      
      <div className="field-input-wrapper">
        {renderField()}
      </div>
      
      {error && (
        <div className="field-error">
          {error}
        </div>
      )}
      
      {/* Character count for text fields with maxLength */}
      {(field.type === 'text' || field.type === 'textarea') && 
       field.validation?.maxLength && 
       typeof value === 'string' && (
        <div className="character-count">
          {value.length} / {field.validation.maxLength}
        </div>
      )}
    </div>
  );
};

export default DynamicField;
