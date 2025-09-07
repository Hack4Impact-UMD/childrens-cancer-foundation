/**
 * Backend service for handling dynamic application submissions
 * Provides compatibility layer between new dynamic forms and existing application system
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  setDoc,
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../index';
import { 
  DynamicApplication, 
  FormTemplate, 
  GrantType,
  FormData
} from '../types/form-template-types';
import { getFormTemplate } from './form-template-service';

/**
 * Collection names
 */
const APPLICATIONS_COLLECTION = 'applications';

/**
 * Submit a dynamic application
 */
export async function submitDynamicApplication(
  formTemplateId: string,
  formData: FormData,
  file: File | null,
  applicantId: string,
  applicationCycle: string
): Promise<string> {
  try {
    // Get the form template to extract metadata
    const template = await getFormTemplate(formTemplateId);
    if (!template) {
      throw new Error('Form template not found');
    }

    // Extract key fields for compatibility with existing system
    const extractedData = extractLegacyFields(formData, template);

    // Clean form data to remove File objects (Firestore can't store them)
    const cleanedFormData = cleanFormDataForFirestore(formData);

    // Validate required fields
    if (!applicantId || !applicationCycle || !formTemplateId) {
      throw new Error('Missing required fields for application submission');
    }

    const now = Timestamp.now();
    
    // Create the application document first to get the ID
    const docRef = doc(collection(db, APPLICATIONS_COLLECTION));
    
    const application: DynamicApplication = {
      applicationId: docRef.id, // Set the ID before saving
      creatorId: applicantId,
      grantType: template.grantType,
      applicationCycle,
      submitTime: now,
      decision: 'pending',
      formTemplateId,
      formVersion: template.version,
      formData: cleanedFormData,
      isLegacy: false,
      
      // Extracted fields for backward compatibility
      ...extractedData,
      
      // File will be handled separately (similar to existing system)
      file: file?.name || undefined
    };

    // Save the document with the ID already set
    await setDoc(docRef, application);

    return docRef.id;
  } catch (error) {
    console.error('Error submitting dynamic application:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      details: (error as any)?.details
    });
    throw new Error('Failed to submit application');
  }
}

/**
 * Get a dynamic application by ID
 */
export async function getDynamicApplication(applicationId: string): Promise<DynamicApplication | null> {
  try {
    const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    const applicationSnap = await getDoc(applicationRef);
    
    if (!applicationSnap.exists()) {
      return null;
    }
    
    const data = applicationSnap.data();
    return {
      applicationId,
      ...data
    } as DynamicApplication;
  } catch (error) {
    console.error('Error getting dynamic application:', error);
    throw new Error('Failed to get application');
  }
}

/**
 * Get applications for a specific applicant
 */
export async function getApplicationsForApplicant(applicantId: string): Promise<DynamicApplication[]> {
  try {
    const q = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('creatorId', '==', applicantId),
      orderBy('submitTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      applicationId: doc.id,
      ...doc.data()
    })) as DynamicApplication[];
  } catch (error) {
    console.error('Error getting applications for applicant:', error);
    throw new Error('Failed to get applications');
  }
}

/**
 * Get applications for a specific application cycle
 */
export async function getApplicationsForCycle(cycleId: string): Promise<DynamicApplication[]> {
  try {
    const q = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('applicationCycle', '==', cycleId),
      orderBy('submitTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      applicationId: doc.id,
      ...doc.data()
    })) as DynamicApplication[];
  } catch (error) {
    console.error('Error getting applications for cycle:', error);
    throw new Error('Failed to get applications for cycle');
  }
}

/**
 * Update application decision
 */
export async function updateApplicationDecision(
  applicationId: string,
  decision: 'pending' | 'accepted' | 'rejected'
): Promise<void> {
  try {
    const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    await updateDoc(applicationRef, {
      decision,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating application decision:', error);
    throw new Error('Failed to update application decision');
  }
}

/**
 * Get applications by grant type
 */
export async function getApplicationsByGrantType(grantType: GrantType): Promise<DynamicApplication[]> {
  try {
    const q = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('grantType', '==', grantType),
      orderBy('submitTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      applicationId: doc.id,
      ...doc.data()
    })) as DynamicApplication[];
  } catch (error) {
    console.error('Error getting applications by grant type:', error);
    throw new Error('Failed to get applications by grant type');
  }
}

/**
 * Convert dynamic application to legacy format for backward compatibility
 */
export function convertToLegacyFormat(application: DynamicApplication): any {
  // If it's already a legacy application, return as-is
  if (application.isLegacy || application.legacyData) {
    return {
      applicationId: application.applicationId,
      creatorId: application.creatorId,
      grantType: application.grantType,
      applicationCycle: application.applicationCycle,
      submitTime: application.submitTime,
      decision: application.decision,
      file: application.file,
      ...application.legacyData,
      // Override with any extracted legacy fields
      title: application.title,
      institution: application.institution,
      amountRequested: application.amountRequested,
      principalInvestigator: application.principalInvestigator
    };
  }

  // Convert dynamic form data to legacy format
  const legacyFields: any = {
    applicationId: application.applicationId,
    creatorId: application.creatorId,
    grantType: application.grantType,
    applicationCycle: application.applicationCycle,
    submitTime: application.submitTime,
    decision: application.decision,
    file: application.file,
    title: application.title,
    institution: application.institution,
    amountRequested: application.amountRequested,
    principalInvestigator: application.principalInvestigator
  };

  // Map common dynamic fields to legacy field names
  const fieldMapping: Record<string, string> = {
    // Dynamic field ID -> Legacy field name
    'title': 'title',
    'principal_investigator': 'principalInvestigator',
    'institution_name': 'institution',
    'amount_requested': 'amountRequested',
    'institution_address': 'institutionAddress',
    'institution_phone': 'institutionPhoneNumber',
    'institution_email': 'institutionEmail',
    'types_of_cancer': 'typesOfCancerAddressed',
    'admin_official_name': 'adminOfficialName',
    'admin_phone': 'adminPhoneNumber',
    'admin_email': 'adminEmail',
    'published_paper': 'includedPublishedPaper',
    'credit_agreement': 'creditAgreement',
    'patent_applied': 'patentApplied',
    'funding_info': 'includedFundingInfo',
    'project_dates': 'dates',
    'continuation': 'continuation',
    'requestor': 'requestor',
    'timeframe': 'timeframe'
  };

  // Apply field mapping
  if (application.formData) {
    Object.entries(application.formData).forEach(([fieldId, value]) => {
      const legacyFieldName = fieldMapping[fieldId] || fieldId;
      legacyFields[legacyFieldName] = value;
    });
  }

  return legacyFields;
}

/**
 * Clean form data to remove File objects and other non-Firestore-compatible types
 */
function cleanFormDataForFirestore(formData: FormData): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  Object.entries(formData).forEach(([key, value]) => {
    if (value instanceof File) {
      // Store file name instead of File object
      cleaned[key] = value.name;
    } else if (value instanceof Date) {
      // Convert Date to string
      cleaned[key] = value.toISOString();
    } else if (value !== undefined && value !== null) {
      // Store other values as-is
      cleaned[key] = value;
    }
  });
  
  return cleaned;
}

/**
 * Extract legacy fields from dynamic form data for compatibility
 */
function extractLegacyFields(formData: FormData, template: FormTemplate): Partial<DynamicApplication> {
  const extracted: Partial<DynamicApplication> = {};

  // Common field mappings based on typical form field IDs
  const extractors: Record<string, (data: FormData) => any> = {
    title: (data) => data['title'] || data['project_title'] || data['grant_title'],
    institution: (data) => data['institution'] || data['institution_name'] || data['organization'],
    amountRequested: (data) => data['amount_requested'] || data['budget'] || data['funding_amount'],
    principalInvestigator: (data) => data['principal_investigator'] || data['pi_name'] || data['investigator']
  };

  // Apply extractors
  Object.entries(extractors).forEach(([field, extractor]) => {
    const value = extractor(formData);
    if (value !== undefined && value !== null && value !== '') {
      (extracted as any)[field] = value;
    }
  });

  return extracted;
}

/**
 * Validate dynamic application data against form template
 */
export function validateApplicationData(
  formData: FormData, 
  template: FormTemplate
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all pages and fields
  template.pages.forEach(page => {
    page.fields.forEach(field => {
      const value = formData[field.id];
      
      // Required field validation
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} is required`);
        return;
      }

      // Skip validation if field is empty and not required
      if (!field.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type-specific validation
      if (field.validation) {
        const validation = field.validation;
        
        // String length validation
        if (typeof value === 'string') {
          if (validation.minLength && value.length < validation.minLength) {
            errors.push(`${field.label} must be at least ${validation.minLength} characters`);
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            errors.push(`${field.label} must be no more than ${validation.maxLength} characters`);
          }
        }

        // Number validation
        if (field.type === 'number' && typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            errors.push(`${field.label} must be at least ${validation.min}`);
          }
          if (validation.max !== undefined && value > validation.max) {
            errors.push(`${field.label} must be no more than ${validation.max}`);
          }
        }

        // Pattern validation
        if (validation.pattern && typeof value === 'string') {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors.push(validation.customMessage || `${field.label} format is invalid`);
          }
        }
      }

      // Email validation
      if (field.type === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.label} must be a valid email address`);
        }
      }

      // URL validation
      if (field.type === 'url' && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          errors.push(`${field.label} must be a valid URL`);
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get application summary for dashboard display
 */
export function getApplicationSummary(application: DynamicApplication): {
  title: string;
  institution: string;
  amount: string;
  submittedDate: string;
  status: string;
} {
  return {
    title: application.title || 'Untitled Application',
    institution: application.institution || 'Unknown Institution',
    amount: application.amountRequested || 'Amount not specified',
    submittedDate: application.submitTime?.toDate().toLocaleDateString() || 'Unknown',
    status: application.decision || 'pending'
  };
}
