import React, { useRef } from 'react';
import { FormField } from '../../types/form-template-types';
import { FaUpload, FaFilePdf, FaTimes } from 'react-icons/fa';
import { Box, Typography, Button, IconButton, FormHelperText } from '@mui/material';

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
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    validateAndUpload(file);
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
      validateAndUpload(files[0]);
    }
  };

  const validateAndUpload = (file: File | null) => {
    if (!file) {
      onFileUpload(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file only.');
      return;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.');
      return;
    }
    onFileUpload(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ width: field.width === 'half' ? '48%' : '100%', mb: 2 }}>
      <Typography variant="subtitle1" component="label" sx={{ fontWeight: 500, mb: 1 }}>
        {field.label}
        {field.required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      {field.helpText && <FormHelperText sx={{ mb: 1 }}>{field.helpText}</FormHelperText>}
      
      {!uploadedFile ? (
        <Box
          sx={{
            border: `2px dashed ${error ? 'red' : 'grey.400'}`,
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: 'grey.50',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.lightest',
            },
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FaUpload size={32} color="grey.600" />
          <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
            Click to upload or drag and drop
          </Typography>
          <Typography variant="body2" color="text.secondary">
            PDF files only, up to 10MB
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            border: 1,
            borderColor: 'grey.300',
            borderRadius: 2,
            bgcolor: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FaFilePdf size={24} color="red" />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{uploadedFile.name}</Typography>
              <Typography variant="body2" color="text.secondary">{formatFileSize(uploadedFile.size)}</Typography>
            </Box>
          </Box>
          <IconButton onClick={handleRemoveFile} title="Remove file">
            <FaTimes />
          </IconButton>
        </Box>
      )}

      {error && <FormHelperText error>{error}</FormHelperText>}

      <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="caption" display="block">• PDF files only</Typography>
        <Typography variant="caption" display="block">• Maximum file size: 10MB</Typography>
        <Typography variant="caption" display="block">• This document should contain your complete grant proposal</Typography>
      </Box>
    </Box>
  );
};

export default FileUploadField;
