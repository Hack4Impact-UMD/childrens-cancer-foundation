/**
 * TypeScript interfaces for the dynamic form template system
 * These types define the structure for versioned, dynamic grant application forms
 */

import { Timestamp } from 'firebase/firestore';

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'multiselect'
  | 'file' 
  | 'date'
  | 'url'
  | 'currency';

export type GrantType = 'research' | 'nextgen' | 'nonresearch';

/**
 * Validation rules for form fields
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  min?: number; // For number/date fields
  max?: number; // For number/date fields
  required?: boolean;
  customMessage?: string; // Custom validation error message
}

/**
 * Conditional logic for showing/hiding fields
 */
export interface ConditionalLogic {
  dependsOn: string; // field ID that this depends on
  showWhen: string | string[]; // values that trigger showing this field
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
}

/**
 * Individual form field definition
 */
export interface FormField {
  id: string; // Unique identifier for the field
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string; // Additional help text for the field
  required: boolean;
  order: number; // Order within the page
  validation?: FieldValidation;
  options?: string[]; // For select, radio, checkbox, multiselect
  conditionalLogic?: ConditionalLogic;
  width?: 'full' | 'half' | 'third' | 'quarter'; // Layout width
  metadata?: {
    description?: string;
    section?: string; // Group fields into sections
  };
}

/**
 * A page within a form template
 */
export interface FormPage {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormField[];
  metadata?: {
    instructions?: string;
    completionMessage?: string;
  };
}

/**
 * Form template metadata
 */
export interface FormTemplateMetadata {
  description?: string;
  instructions?: string;
  estimatedTime?: number; // Estimated completion time in minutes
  category?: string;
  tags?: string[];
}

/**
 * Main form template interface
 */
export interface FormTemplate {
  id: string;
  name: string; // e.g., "Research Grant Form v2.0"
  grantType: GrantType;
  version: number; // 1, 2, 3, etc.
  isActive: boolean; // Only one version can be active per grantType
  isPublished: boolean; // Whether this template is available for use
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin email who created this template
  lastModifiedBy: string; // Admin email who last modified this template
  pages: FormPage[];
  metadata: FormTemplateMetadata;
  
  // Versioning information
  parentVersionId?: string; // ID of the previous version this was based on
  changeLog?: string; // Description of changes made in this version
  
  // Application cycle association
  applicationCycleId?: string; // Optional: associate with specific cycle
}

/**
 * Form template version history entry
 */
export interface FormTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
  changeLog?: string;
  isActive: boolean;
  formData: FormTemplate; // Snapshot of the template at this version
}

/**
 * Enhanced application interface with dynamic form support
 */
export interface DynamicApplication {
  // Existing application fields
  applicationId: string;
  creatorId: string;
  grantType: GrantType;
  applicationCycle: string;
  submitTime: Timestamp;
  decision: 'pending' | 'accepted' | 'rejected';
  file?: string; // Name of the file in Firebase Storage
  
  // Dynamic form fields
  formTemplateId: string; // Reference to the form template used
  formVersion: number; // Version of the form template at submission time
  formData: Record<string, any>; // Dynamic form responses keyed by field ID
  
  // Legacy compatibility
  legacyData?: Record<string, any>; // For migrated applications from old system
  isLegacy?: boolean; // Flag to indicate if this is a migrated application
  
  // Derived fields for compatibility
  title?: string; // Extracted from formData or legacy data
  institution?: string;
  amountRequested?: string;
  principalInvestigator?: string;
}

/**
 * Form builder state interface for the admin interface
 */
export interface FormBuilderState {
  template: FormTemplate;
  selectedPageId: string | null;
  selectedFieldId: string | null;
  isPreviewMode: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: ValidationError[];
}

/**
 * Validation error for form builder
 */
export interface ValidationError {
  type: 'field' | 'page' | 'template';
  id: string; // ID of the element with the error
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Form submission response
 */
export interface FormSubmissionResponse {
  success: boolean;
  applicationId?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Form field component props
 */
export interface DynamicFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  onBlur?: (fieldId: string) => void;
  error?: string;
  disabled?: boolean;
  showConditionally?: boolean;
}

/**
 * Form template statistics
 */
export interface FormTemplateStats {
  templateId: string;
  version: number;
  totalSubmissions: number;
  completionRate: number; // Percentage of started forms that were completed
  averageCompletionTime: number; // In minutes
  fieldStats: {
    fieldId: string;
    fieldLabel: string;
    completionRate: number;
    validationErrorRate: number;
  }[];
}

/**
 * Export types for form rendering
 */
export type FormData = Record<string, any>;
export type FieldErrors = Record<string, string>;
export type FormErrors = Record<string, string>;

/**
 * Form template filter options for admin interface
 */
export interface FormTemplateFilter {
  grantType?: GrantType | 'all';
  status?: 'active' | 'draft' | 'archived' | 'all';
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}
