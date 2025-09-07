import React from 'react';
import { FormPage, FormField } from '../../../types/form-template-types';
import { FaPlus, FaGripVertical, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
import './FormPageEditor.css';

interface FormPageEditorProps {
  page: FormPage;
  onPageChange: (updates: Partial<FormPage>) => void;
  onAddField: () => void;
  onFieldSelect: (fieldId: string) => void;
  onFieldChange: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  selectedFieldId: string | null;
}

const FormPageEditor: React.FC<FormPageEditorProps> = ({
  page,
  onAddField,
  onFieldSelect,
  onDeleteField,
  onDuplicateField,
  selectedFieldId
}) => {
  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text': return '📝';
      case 'textarea': return '📄';
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'number': return '🔢';
      case 'currency': return '💰';
      case 'date': return '📅';
      case 'select': return '📋';
      case 'radio': return '◉';
      case 'checkbox': return '☑️';
      case 'file': return '📎';
      case 'url': return '🌐';
      default: return '📝';
    }
  };

  const getFieldTypeLabel = (fieldType: string) => {
    return fieldType.charAt(0).toUpperCase() + fieldType.slice(1);
  };

  const sortedFields = [...page.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="form-page-editor">
      <div className="page-header">
        <div className="page-title-section">
          <h2>{page.title}</h2>
          {page.description && <p className="page-description">{page.description}</p>}
        </div>
        
        <button onClick={onAddField} className="add-field-btn">
          <FaPlus /> Add Field
        </button>
      </div>

      <div className="fields-container">
        {sortedFields.length === 0 ? (
          <div className="empty-fields">
            <div className="empty-content">
              <h3>No fields yet</h3>
              <p>Add your first field to get started</p>
              <button onClick={onAddField} className="add-first-field-btn">
                <FaPlus /> Add First Field
              </button>
            </div>
          </div>
        ) : (
          <div className="fields-list">
            {sortedFields.map((field, index) => (
              <div
                key={field.id}
                className={`field-item ${selectedFieldId === field.id ? 'selected' : ''}`}
                onClick={() => onFieldSelect(field.id)}
              >
                <div className="field-drag-handle">
                  <FaGripVertical />
                </div>
                
                <div className="field-content">
                  <div className="field-header">
                    <div className="field-icon">
                      {getFieldIcon(field.type)}
                    </div>
                    <div className="field-info">
                      <div className="field-label">
                        {field.label}
                        {field.required && <span className="required-indicator">*</span>}
                      </div>
                      <div className="field-meta">
                        {getFieldTypeLabel(field.type)} • Order {field.order}
                        {field.width && field.width !== 'full' && ` • ${field.width} width`}
                      </div>
                    </div>
                  </div>
                  
                  {field.placeholder && (
                    <div className="field-placeholder">
                      Placeholder: "{field.placeholder}"
                    </div>
                  )}
                  
                  {field.helpText && (
                    <div className="field-help-text">
                      Help: {field.helpText}
                    </div>
                  )}
                  
                  {field.validation && (
                    <div className="field-validation">
                      <div className="validation-rules">
                        {field.validation.required && <span className="rule">Required</span>}
                        {field.validation.minLength && <span className="rule">Min: {field.validation.minLength}</span>}
                        {field.validation.maxLength && <span className="rule">Max: {field.validation.maxLength}</span>}
                        {field.validation.pattern && <span className="rule">Pattern</span>}
                      </div>
                    </div>
                  )}
                  
                  {field.options && field.options.length > 0 && (
                    <div className="field-options">
                      <strong>Options:</strong> {field.options.join(', ')}
                    </div>
                  )}
                  
                  {field.conditionalLogic && (
                    <div className="field-conditional">
                      <strong>Conditional:</strong> Show when {field.conditionalLogic.dependsOn} = {field.conditionalLogic.showWhen}
                    </div>
                  )}
                </div>
                
                <div className="field-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFieldSelect(field.id);
                    }}
                    className="field-action-btn edit"
                    title="Edit field"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateField(field.id);
                    }}
                    className="field-action-btn duplicate"
                    title="Duplicate field"
                  >
                    <FaCopy />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteField(field.id);
                    }}
                    className="field-action-btn delete"
                    title="Delete field"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="page-footer">
        <div className="field-count">
          {page.fields.length} field{page.fields.length !== 1 ? 's' : ''}
        </div>
        
        <button onClick={onAddField} className="add-field-footer-btn">
          <FaPlus /> Add Another Field
        </button>
      </div>
    </div>
  );
};

export default FormPageEditor;
