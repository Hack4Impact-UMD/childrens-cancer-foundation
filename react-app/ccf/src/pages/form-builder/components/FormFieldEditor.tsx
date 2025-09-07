import React, { useState } from 'react';
import { FormField, FieldType } from '../../../types/form-template-types';
import './FormFieldEditor.css';

interface FormFieldEditorProps {
  field: FormField;
  onFieldChange: (updates: Partial<FormField>) => void;
}

const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
  field,
  onFieldChange
}) => {
  const [optionsText, setOptionsText] = useState(field.options?.join('\n') || '');

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'currency', label: 'Currency' },
    { value: 'date', label: 'Date' },
    { value: 'url', label: 'URL' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'multiselect', label: 'Multi-Select' },
    { value: 'file', label: 'File Upload' }
  ];

  const widthOptions = [
    { value: 'full', label: 'Full Width' },
    { value: 'half', label: 'Half Width' },
    { value: 'third', label: 'One Third' },
    { value: 'quarter', label: 'One Quarter' }
  ];

  const handleOptionsChange = (newOptionsText: string) => {
    setOptionsText(newOptionsText);
    const options = newOptionsText
      .split('\n')
      .map(option => option.trim())
      .filter(option => option.length > 0);
    
    onFieldChange({ options: options.length > 0 ? options : undefined });
  };

  const handleValidationChange = (key: string, value: any) => {
    const currentValidation = field.validation || {};
    onFieldChange({
      validation: {
        ...currentValidation,
        [key]: value || undefined
      }
    });
  };

  const handleConditionalLogicChange = (key: string, value: any) => {
    const currentLogic = field.conditionalLogic || { dependsOn: '', showWhen: '' };
    onFieldChange({
      conditionalLogic: {
        ...currentLogic,
        [key]: value
      }
    });
  };

  const supportsOptions = ['select', 'radio', 'checkbox', 'multiselect'].includes(field.type);
  const supportsValidation = !['file'].includes(field.type);

  return (
    <div className="form-field-editor">
      <h4>Field Properties</h4>
      
      {/* Basic Properties */}
      <div className="property-section">
        <h5>Basic Settings</h5>
        
        <div className="property-group">
          <label>Field Type</label>
          <select
            value={field.type}
            onChange={(e) => onFieldChange({ type: e.target.value as FieldType })}
            className="property-input"
          >
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="property-group">
          <label>Label *</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onFieldChange({ label: e.target.value })}
            className="property-input"
            placeholder="Enter field label"
          />
        </div>

        <div className="property-group">
          <label>Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onFieldChange({ placeholder: e.target.value })}
            className="property-input"
            placeholder="Enter placeholder text"
          />
        </div>

        <div className="property-group">
          <label>Help Text</label>
          <textarea
            value={field.helpText || ''}
            onChange={(e) => onFieldChange({ helpText: e.target.value })}
            className="property-textarea"
            placeholder="Additional help or instructions for this field"
            rows={2}
          />
        </div>

        <div className="property-group">
          <label>Width</label>
          <select
            value={field.width || 'full'}
            onChange={(e) => onFieldChange({ width: e.target.value as any })}
            className="property-input"
          >
            {widthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="property-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onFieldChange({ required: e.target.checked })}
            />
            <span>Required Field</span>
          </label>
        </div>
      </div>

      {/* Options */}
      {supportsOptions && (
        <div className="property-section">
          <h5>Options</h5>
          <div className="property-group">
            <label>Options (one per line)</label>
            <textarea
              value={optionsText}
              onChange={(e) => handleOptionsChange(e.target.value)}
              className="property-textarea"
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
            />
            <div className="property-help">
              Enter each option on a new line
            </div>
          </div>
        </div>
      )}

      {/* Validation */}
      {supportsValidation && (
        <div className="property-section">
          <h5>Validation</h5>
          
          {(field.type === 'text' || field.type === 'textarea') && (
            <>
              <div className="property-group">
                <label>Minimum Length</label>
                <input
                  type="number"
                  value={field.validation?.minLength || ''}
                  onChange={(e) => handleValidationChange('minLength', parseInt(e.target.value) || undefined)}
                  className="property-input"
                  placeholder="e.g., 5"
                  min="0"
                />
              </div>
              
              <div className="property-group">
                <label>Maximum Length</label>
                <input
                  type="number"
                  value={field.validation?.maxLength || ''}
                  onChange={(e) => handleValidationChange('maxLength', parseInt(e.target.value) || undefined)}
                  className="property-input"
                  placeholder="e.g., 200"
                  min="1"
                />
              </div>
            </>
          )}

          {(field.type === 'number' || field.type === 'currency') && (
            <>
              <div className="property-group">
                <label>Minimum Value</label>
                <input
                  type="number"
                  value={field.validation?.min || ''}
                  onChange={(e) => handleValidationChange('min', parseFloat(e.target.value) || undefined)}
                  className="property-input"
                  placeholder="e.g., 0"
                />
              </div>
              
              <div className="property-group">
                <label>Maximum Value</label>
                <input
                  type="number"
                  value={field.validation?.max || ''}
                  onChange={(e) => handleValidationChange('max', parseFloat(e.target.value) || undefined)}
                  className="property-input"
                  placeholder="e.g., 1000000"
                />
              </div>
            </>
          )}

          <div className="property-group">
            <label>Pattern (Regex)</label>
            <input
              type="text"
              value={field.validation?.pattern || ''}
              onChange={(e) => handleValidationChange('pattern', e.target.value)}
              className="property-input"
              placeholder="e.g., ^[0-9]{2}-[0-9]{7}$"
            />
          </div>

          <div className="property-group">
            <label>Custom Error Message</label>
            <input
              type="text"
              value={field.validation?.customMessage || ''}
              onChange={(e) => handleValidationChange('customMessage', e.target.value)}
              className="property-input"
              placeholder="Custom validation error message"
            />
          </div>
        </div>
      )}

      {/* Conditional Logic */}
      <div className="property-section">
        <h5>Conditional Logic</h5>
        <div className="property-help">
          Show this field only when another field has a specific value
        </div>
        
        <div className="property-group">
          <label>Depends On Field ID</label>
          <input
            type="text"
            value={field.conditionalLogic?.dependsOn || ''}
            onChange={(e) => handleConditionalLogicChange('dependsOn', e.target.value)}
            className="property-input"
            placeholder="e.g., other_field_id"
          />
        </div>

        <div className="property-group">
          <label>Show When Value Equals</label>
          <input
            type="text"
            value={field.conditionalLogic?.showWhen || ''}
            onChange={(e) => handleConditionalLogicChange('showWhen', e.target.value)}
            className="property-input"
            placeholder="e.g., Yes"
          />
        </div>

        <div className="property-group">
          <label>Operator</label>
          <select
            value={field.conditionalLogic?.operator || 'equals'}
            onChange={(e) => handleConditionalLogicChange('operator', e.target.value)}
            className="property-input"
          >
            <option value="equals">Equals</option>
            <option value="not_equals">Not Equals</option>
            <option value="contains">Contains</option>
            <option value="greater_than">Greater Than</option>
            <option value="less_than">Less Than</option>
          </select>
        </div>
      </div>

      {/* Advanced */}
      <div className="property-section">
        <h5>Advanced</h5>
        
        <div className="property-group">
          <label>Field ID</label>
          <input
            type="text"
            value={field.id}
            onChange={(e) => onFieldChange({ id: e.target.value })}
            className="property-input"
            placeholder="unique_field_id"
          />
          <div className="property-help">
            Unique identifier for this field (used in data storage)
          </div>
        </div>

        <div className="property-group">
          <label>Order</label>
          <input
            type="number"
            value={field.order}
            onChange={(e) => onFieldChange({ order: parseInt(e.target.value) || 1 })}
            className="property-input"
            min="1"
          />
        </div>

        <div className="property-group">
          <label>Section</label>
          <input
            type="text"
            value={field.metadata?.section || ''}
            onChange={(e) => onFieldChange({ 
              metadata: { 
                ...field.metadata, 
                section: e.target.value 
              }
            })}
            className="property-input"
            placeholder="Section name (optional)"
          />
          <div className="property-help">
            Group fields into sections for better organization
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormFieldEditor;
