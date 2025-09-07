import React from 'react';
import { FormTemplate } from '../../../types/form-template-types';
import { FaEdit, FaEye, FaCopy, FaTrash, FaCheck, FaCalendar, FaUser, FaFileAlt } from 'react-icons/fa';
import './FormTemplateCard.css';

interface FormTemplateCardProps {
  template: FormTemplate;
  onEdit: (templateId: string) => void;
  onPreview: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onActivate: (templateId: string) => void;
}

const FormTemplateCard: React.FC<FormTemplateCardProps> = ({
  template,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onActivate
}) => {
  const getStatusBadge = () => {
    if (template.isActive) {
      return <span className="status-badge active">Active</span>;
    } else if (!template.isPublished) {
      return <span className="status-badge draft">Draft</span>;
    } else {
      return <span className="status-badge archived">Archived</span>;
    }
  };

  const getGrantTypeColor = (grantType: string) => {
    switch (grantType) {
      case 'research':
        return '#007bff';
      case 'nextgen':
        return '#28a745';
      case 'nonresearch':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFieldCount = () => {
    return template.pages.reduce((total, page) => total + page.fields.length, 0);
  };

  return (
    <div className="form-template-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">{template.name}</h3>
          <div className="card-badges">
            {getStatusBadge()}
            <span 
              className="grant-type-badge"
              style={{ backgroundColor: getGrantTypeColor(template.grantType) }}
            >
              {template.grantType.charAt(0).toUpperCase() + template.grantType.slice(1)}
            </span>
          </div>
        </div>
        <div className="card-version">
          v{template.version}
        </div>
      </div>

      <div className="card-content">
        {template.metadata?.description && (
          <p className="card-description">{template.metadata.description}</p>
        )}
        
        <div className="card-stats">
          <div className="stat">
            <FaFileAlt className="stat-icon" />
            <span>{template.pages.length} pages</span>
          </div>
          <div className="stat">
            <FaEdit className="stat-icon" />
            <span>{getFieldCount()} fields</span>
          </div>
        </div>

        <div className="card-meta">
          <div className="meta-item">
            <FaUser className="meta-icon" />
            <span>By {template.createdBy}</span>
          </div>
          <div className="meta-item">
            <FaCalendar className="meta-icon" />
            <span>{formatDate(template.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button
          className="action-btn primary"
          onClick={() => onEdit(template.id)}
          title="Edit template"
        >
          <FaEdit /> Edit
        </button>
        
        <button
          className="action-btn secondary"
          onClick={() => onPreview(template.id)}
          title="Preview template"
        >
          <FaEye /> Preview
        </button>

        {!template.isActive && (
          <button
            className="action-btn success"
            onClick={() => onActivate(template.id)}
            title="Activate template"
          >
            <FaCheck /> Activate
          </button>
        )}

        <div className="action-menu">
          <button className="action-btn menu-trigger">⋯</button>
          <div className="action-menu-content">
            <button
              className="menu-item"
              onClick={() => onDuplicate(template.id)}
            >
              <FaCopy /> Duplicate
            </button>
            <button
              className="menu-item danger"
              onClick={() => onDelete(template.id)}
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormTemplateCard;
