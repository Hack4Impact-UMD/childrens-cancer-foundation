import React, { useState } from 'react';
import { GrantType } from '../../../types/form-template-types';
import { createFormTemplate } from '../../../backend/form-template-service';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import './CreateTemplateModal.css';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: (templateId: string) => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [grantType, setGrantType] = useState<GrantType>('research');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setIsCreating(true);
    
    try {
      const template = {
        name: name.trim(),
        grantType,
        version: 1,
        isActive: false,
        isPublished: false,
        pages: [],
        createdBy: 'admin@example.com',
        lastModifiedBy: 'admin@example.com',
        metadata: {
          description: description.trim() || undefined,
          estimatedTime
        }
      };

      const templateId = await createFormTemplate(template, 'admin@example.com');
      
      toast.success('Template created successfully!');
      onTemplateCreated(templateId);
      handleClose();
      
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setGrantType('research');
    setEstimatedTime(30);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Template</h2>
          <button onClick={handleClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="template-name">Template Name *</label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research Grant Application 2024"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="template-description">Description</label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
              rows={3}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="grant-type">Grant Type *</label>
            <select
              id="grant-type"
              value={grantType}
              onChange={(e) => setGrantType(e.target.value as GrantType)}
              required
              className="form-select"
            >
              <option value="research">Research</option>
              <option value="nextgen">NextGen</option>
              <option value="nonresearch">Non-Research</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="estimated-time">Estimated Time (minutes)</label>
            <input
              id="estimated-time"
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 30)}
              min="5"
              max="180"
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={isCreating} className="create-btn">
              {isCreating ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;