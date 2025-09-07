import React, { useRef } from 'react';
import { FormField } from '../../types/form-template-types';
import { FaUpload, FaFile, FaTimes, FaFilePdf } from 'react-icons/fa';
import './FileUploadField.css';

interface FileUploadFieldProps {
  field: FormField;
  uploadedFile: File | null;
  onFileUpload: (file: File | null) => void;
  error?: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  field,
  uploadedFile,
  onFileUpload,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      // Validate file type (PDF only for now)
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.');
        return;
      }
    }

    onFileUpload(file);
  };

  const handleRemoveFile = () => {
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        return;
      }

      // Validate file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.');
        return;
      }

      onFileUpload(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-upload-field field-${field.width || 'full'}`}>
      <label className="field-label">
        {field.label}
        {field.required && <span className="required-indicator">*</span>}
      </label>
      
      {field.helpText && (
        <div className="field-help">
          {field.helpText}
        </div>
      )}

      <div className="file-upload-container">
        {!uploadedFile ? (
          <div
            className={`file-drop-zone ${error ? 'error' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-content">
              <FaUpload className="upload-icon" />
              <div className="upload-text">
                <p className="primary-text">Click to upload or drag and drop</p>
                <p className="secondary-text">PDF files only, up to 10MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="uploaded-file">
            <div className="file-info">
              <div className="file-icon">
                <FaFilePdf />
              </div>
              <div className="file-details">
                <div className="file-name">{uploadedFile.name}</div>
                <div className="file-size">{formatFileSize(uploadedFile.size)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="remove-file-btn"
              title="Remove file"
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="field-error">
          {error}
        </div>
      )}

      <div className="file-upload-help">
        <p>• PDF files only</p>
        <p>• Maximum file size: 10MB</p>
        <p>• This document should contain your complete grant proposal</p>
      </div>
    </div>
  );
};

export default FileUploadField;
