import React from 'react';
import { FormField, DynamicFieldProps } from '../../types/form-template-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  FormHelperText,
  InputAdornment,
  Typography,
  Box,
} from '@mui/material';

const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const handleChange = (newValue: any) => {
    onChange(field.id, newValue);
  };

  const renderField = () => {
    const commonProps = {
      id: field.id,
      label: field.label,
      disabled,
      error: !!error,
      fullWidth: true,
      variant: 'outlined' as const,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <TextField
            {...commonProps}
            type={field.type}
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            inputProps={{ maxLength: field.validation?.maxLength }}
          />
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={4}
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            inputProps={{ maxLength: field.validation?.maxLength }}
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            type="number"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(parseFloat(e.target.value) || '')}
            inputProps={{ min: field.validation?.min, max: field.validation?.max }}
          />
        );

      case 'date':
        return (
          <TextField
            {...commonProps}
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: field.validation?.min, max: field.validation?.max }}
          />
        );

      case 'currency':
        return (
          <TextField
            {...commonProps}
            type="text"
            value={value || ''}
            placeholder={field.placeholder || '0.00'}
            onChange={(e) => handleChange(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth error={!!error}>
            <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
            <Select
              labelId={`${field.id}-label`}
              id={field.id}
              value={value || ''}
              label={field.label}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
            >
              <MenuItem value="">
                <em>Select an option...</em>
              </MenuItem>
              {field.options?.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" error={!!error}>
            <RadioGroup
              name={field.id}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
            >
              {field.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio disabled={disabled} />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkbox':
        if (field.options && field.options.length > 1) {
          return (
            <FormGroup>
              {field.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={Array.isArray(value) ? value.includes(option) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleChange([...currentValues, option]);
                        } else {
                          handleChange(currentValues.filter((v) => v !== option));
                        }
                      }}
                      disabled={disabled}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
          );
        } else {
          return (
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(value)}
                  onChange={(e) => handleChange(e.target.checked)}
                  disabled={disabled}
                />
              }
              label={field.options?.[0] || field.label}
            />
          );
        }

      case 'multiselect':
        return (
          <FormControl fullWidth error={!!error}>
            <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
            <Select
              labelId={`${field.id}-label`}
              id={field.id}
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => handleChange(e.target.value as string[])}
              label={field.label}
              disabled={disabled}
            >
              {field.options?.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
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
    <Box sx={{ mb: 2, width: field.width === 'half' ? '48%' : '100%' }}>
      <Typography variant="subtitle1" component="label" htmlFor={field.id} sx={{ fontWeight: 500, mb: 1 }}>
        {field.label}
        {field.required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      {field.helpText && <FormHelperText sx={{ mb: 1 }}>{field.helpText}</FormHelperText>}
      {renderField()}
      {error && <FormHelperText error>{error}</FormHelperText>}
      {(field.type === 'text' || field.type === 'textarea') &&
        field.validation?.maxLength &&
        typeof value === 'string' && (
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
            {value.length} / {field.validation.maxLength}
          </Typography>
        )}
    </Box>
  );
};

export default DynamicField;
