/**
 * Migration service for transitioning from legacy application system to dynamic forms
 * Handles data migration, template creation, and backward compatibility
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc,
  writeBatch,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '../index';
import { 
  FormTemplate, 
  GrantType,
  DynamicApplication
} from '../types/form-template-types';
import { createFormTemplate } from './form-template-service';

/**
 * Collection names
 */
const APPLICATIONS_COLLECTION = 'applications';

/**
 * Create default form templates based on existing application structure
 */
export async function createDefaultFormTemplates(): Promise<void> {
  try {
    console.log('Creating default form templates...');

    // Research Grant Template
    const researchTemplate = createResearchTemplate();
    const researchTemplateId = await createFormTemplate(researchTemplate, 'system-migration');
    console.log(`Created Research template: ${researchTemplateId}`);

    // NextGen Grant Template  
    const nextgenTemplate = createNextGenTemplate();
    const nextgenTemplateId = await createFormTemplate(nextgenTemplate, 'system-migration');
    console.log(`Created NextGen template: ${nextgenTemplateId}`);

    // Non-Research Grant Template
    const nonresearchTemplate = createNonResearchTemplate();
    const nonresearchTemplateId = await createFormTemplate(nonresearchTemplate, 'system-migration');
    console.log(`Created Non-Research template: ${nonresearchTemplateId}`);

    console.log('Default form templates created successfully');
  } catch (error) {
    console.error('Error creating default form templates:', error);
    throw new Error('Failed to create default form templates');
  }
}

/**
 * Migrate existing applications to the new dynamic format
 */
export async function migrateExistingApplications(): Promise<void> {
  try {
    console.log('Starting application migration...');

    // Get all existing applications
    const applicationsSnapshot = await getDocs(collection(db, APPLICATIONS_COLLECTION));
    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${applications.length} applications to migrate`);

    // Process in batches to avoid Firestore limits
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize);
      batches.push(batch);
    }

    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1} of ${batches.length}`);
      await migrateBatch(batches[i]);
    }

    console.log('Application migration completed successfully');
  } catch (error) {
    console.error('Error migrating applications:', error);
    throw new Error('Failed to migrate applications');
  }
}

/**
 * Migrate a batch of applications
 */
async function migrateBatch(applications: any[]): Promise<void> {
  const batch = writeBatch(db);

  for (const app of applications) {
    // Skip if already migrated
    if (app.formTemplateId || app.isLegacy !== undefined) {
      continue;
    }

    const appRef = doc(db, APPLICATIONS_COLLECTION, app.id);
    
    // Convert legacy application to new format
    const migratedApp = convertLegacyApplication(app);
    
    batch.update(appRef, migratedApp);
  }

  await batch.commit();
}

/**
 * Convert a legacy application to the new dynamic format
 */
function convertLegacyApplication(legacyApp: any): Partial<DynamicApplication> {
  // Mark as legacy application
  const migratedApp: Partial<DynamicApplication> = {
    isLegacy: true,
    legacyData: { ...legacyApp },
    
    // Extract common fields for compatibility
    title: legacyApp.title,
    institution: legacyApp.institution,
    amountRequested: legacyApp.amountRequested,
    principalInvestigator: legacyApp.principalInvestigator,
    
    // Preserve existing fields
    applicationId: legacyApp.applicationId,
    creatorId: legacyApp.creatorId,
    grantType: legacyApp.grantType,
    applicationCycle: legacyApp.applicationCycle,
    submitTime: legacyApp.submitTime,
    decision: legacyApp.decision,
    file: legacyApp.file
  };

  return migratedApp;
}

/**
 * Create Research Grant template based on existing form structure
 */
function createResearchTemplate(): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Research Grant Application Form',
    grantType: 'research' as GrantType,
    version: 1,
    isActive: false,
    isPublished: false,
    createdBy: 'system-migration',
    lastModifiedBy: 'system-migration',
    pages: [
      {
        id: 'grant-proposal',
        title: 'Grant Proposal',
        description: 'Upload your grant proposal document',
        order: 1,
        fields: [
          {
            id: 'file',
            type: 'file',
            label: 'Grant Proposal Document',
            placeholder: '',
            required: true,
            order: 1,
            width: 'full',
            helpText: 'Please upload your complete grant proposal as a PDF file'
          }
        ]
      },
      {
        id: 'about-grant',
        title: 'About Grant',
        description: 'Provide basic information about your grant request',
        order: 2,
        fields: [
          {
            id: 'amount_requested',
            type: 'currency',
            label: 'Amount Requested',
            placeholder: 'Enter the amount you are requesting',
            required: true,
            order: 1,
            width: 'half',
            validation: {
              min: 1000,
              max: 1000000
            }
          },
          {
            id: 'dates',
            type: 'text',
            label: 'Project Timeline',
            placeholder: 'Enter project duration (e.g., 12 months)',
            required: true,
            order: 2,
            width: 'half'
          },
          {
            id: 'continuation',
            type: 'radio',
            label: 'Is this a continuation of previous work?',
            required: true,
            order: 3,
            width: 'full',
            options: ['Yes', 'No']
          }
        ]
      },
      {
        id: 'my-information',
        title: 'My Information',
        description: 'Please provide your contact and institutional information',
        order: 3,
        fields: [
          {
            id: 'title',
            type: 'text',
            label: 'Project Title',
            placeholder: 'Enter the title of your research project',
            required: true,
            order: 1,
            width: 'full',
            validation: {
              minLength: 10,
              maxLength: 200
            }
          },
          {
            id: 'principal_investigator',
            type: 'text',
            label: 'Principal Investigator',
            placeholder: 'Enter your full name',
            required: true,
            order: 2,
            width: 'half'
          },
          {
            id: 'institution',
            type: 'text',
            label: 'Institution',
            placeholder: 'Enter your institution name',
            required: true,
            order: 3,
            width: 'half'
          },
          {
            id: 'department',
            type: 'text',
            label: 'Department',
            placeholder: 'Enter your department',
            required: true,
            order: 4,
            width: 'half'
          },
          {
            id: 'department_head',
            type: 'text',
            label: 'Department Head',
            placeholder: 'Enter department head name',
            required: true,
            order: 5,
            width: 'half'
          },
          {
            id: 'institution_address',
            type: 'textarea',
            label: 'Institution Address',
            placeholder: 'Enter complete institution address',
            required: true,
            order: 6,
            width: 'full'
          },
          {
            id: 'institution_phone',
            type: 'phone',
            label: 'Institution Phone',
            placeholder: '(123) 456-7890',
            required: true,
            order: 7,
            width: 'half'
          },
          {
            id: 'institution_email',
            type: 'email',
            label: 'Institution Email',
            placeholder: 'institution@example.com',
            required: true,
            order: 8,
            width: 'half'
          },
          {
            id: 'types_of_cancer',
            type: 'textarea',
            label: 'Types of Cancer Addressed',
            placeholder: 'Describe the types of cancer your research addresses',
            required: true,
            order: 9,
            width: 'full'
          }
        ]
      },
      {
        id: 'application-questions',
        title: 'Application Questions',
        description: 'Please answer the following questions about your application',
        order: 4,
        fields: [
          {
            id: 'published_paper',
            type: 'radio',
            label: 'Have you included a published paper?',
            required: true,
            order: 1,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'credit_agreement',
            type: 'radio',
            label: 'Do you agree to credit the foundation?',
            required: true,
            order: 2,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'patent_applied',
            type: 'radio',
            label: 'Have you applied for any patents?',
            required: true,
            order: 3,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'funding_info',
            type: 'radio',
            label: 'Have you included funding information?',
            required: true,
            order: 4,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'ein_number',
            type: 'text',
            label: 'EIN Number',
            placeholder: 'Enter your EIN number',
            required: true,
            order: 5,
            width: 'half'
          }
        ]
      }
    ],
    metadata: {
      description: 'Standard research grant application form',
      instructions: 'Please complete all sections of this form and upload your research proposal document.',
      estimatedTime: 45
    }
  };
}

/**
 * Create NextGen Grant template
 */
function createNextGenTemplate(): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  const researchTemplate = createResearchTemplate();
  return {
    ...researchTemplate,
    name: 'NextGen Grant Application Form',
    grantType: 'nextgen' as GrantType,
    metadata: {
      ...researchTemplate.metadata,
      description: 'NextGen grant application form for emerging researchers',
      instructions: 'This form is designed for early-career researchers. Please complete all sections and provide detailed information about your innovative research proposal.'
    }
  };
}

/**
 * Create Non-Research Grant template
 */
function createNonResearchTemplate(): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Non-Research Grant Application Form',
    grantType: 'nonresearch' as GrantType,
    version: 1,
    isActive: false,
    isPublished: false,
    createdBy: 'system-migration',
    lastModifiedBy: 'system-migration',
    pages: [
      {
        id: 'about-grant',
        title: 'About Grant',
        description: 'Provide basic information about your grant request',
        order: 1,
        fields: [
          {
            id: 'title',
            type: 'text',
            label: 'Project Title',
            placeholder: 'Enter the title of your project',
            required: true,
            order: 1,
            width: 'full',
            validation: {
              minLength: 10,
              maxLength: 200
            }
          },
          {
            id: 'amount_requested',
            type: 'currency',
            label: 'Amount Requested',
            placeholder: 'Enter the amount you are requesting',
            required: true,
            order: 2,
            width: 'half'
          },
          {
            id: 'timeframe',
            type: 'text',
            label: 'Project Timeframe',
            placeholder: 'Enter project duration',
            required: true,
            order: 3,
            width: 'half'
          }
        ]
      },
      {
        id: 'my-information',
        title: 'My Information',
        description: 'Please provide your contact information',
        order: 2,
        fields: [
          {
            id: 'requestor',
            type: 'text',
            label: 'Requestor Name',
            placeholder: 'Enter your full name',
            required: true,
            order: 1,
            width: 'half'
          },
          {
            id: 'institution',
            type: 'text',
            label: 'Organization',
            placeholder: 'Enter your organization name',
            required: true,
            order: 2,
            width: 'half'
          },
          {
            id: 'institution_phone',
            type: 'phone',
            label: 'Phone Number',
            placeholder: '(123) 456-7890',
            required: true,
            order: 3,
            width: 'half'
          },
          {
            id: 'institution_email',
            type: 'email',
            label: 'Email Address',
            placeholder: 'your.email@example.com',
            required: true,
            order: 4,
            width: 'half'
          }
        ]
      },
      {
        id: 'narrative',
        title: 'Project Narrative',
        description: 'Provide details about your project',
        order: 3,
        fields: [
          {
            id: 'explanation',
            type: 'textarea',
            label: 'Project Explanation',
            placeholder: 'Provide a detailed explanation of your project',
            required: false,
            order: 1,
            width: 'full'
          },
          {
            id: 'sources',
            type: 'textarea',
            label: 'Sources and References',
            placeholder: 'List any sources or references for your project',
            required: false,
            order: 2,
            width: 'full'
          },
          {
            id: 'additional_info',
            type: 'textarea',
            label: 'Additional Information',
            placeholder: 'Any additional information you would like to provide',
            required: false,
            order: 3,
            width: 'full'
          },
          {
            id: 'file',
            type: 'file',
            label: 'Supporting Document',
            placeholder: '',
            required: true,
            order: 4,
            width: 'full',
            helpText: 'Please upload a PDF document with additional project details'
          }
        ]
      }
    ],
    metadata: {
      description: 'Non-research grant application form',
      instructions: 'Please complete all sections of this form for non-research grant applications.',
      estimatedTime: 30
    }
  };
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  totalApplications: number;
  migratedApplications: number;
  legacyApplications: number;
  templatesCreated: boolean;
}> {
  try {
    // Count total applications
    const applicationsSnapshot = await getDocs(collection(db, APPLICATIONS_COLLECTION));
    const totalApplications = applicationsSnapshot.size;

    // Count migrated applications (those with isLegacy flag)
    const migratedQuery = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('isLegacy', '!=', null)
    );
    const migratedSnapshot = await getDocs(migratedQuery);
    const migratedApplications = migratedSnapshot.size;

    const legacyApplications = totalApplications - migratedApplications;

    // Check if templates exist
    const templatesSnapshot = await getDocs(collection(db, 'formTemplates'));
    const templatesCreated = templatesSnapshot.size > 0;

    return {
      totalApplications,
      migratedApplications,
      legacyApplications,
      templatesCreated
    };
  } catch (error) {
    console.error('Error getting migration status:', error);
    throw new Error('Failed to get migration status');
  }
}

/**
 * Run complete migration process
 */
export async function runCompleteMigration(): Promise<void> {
  try {
    console.log('Starting complete migration process...');

    // Step 1: Create default form templates
    await createDefaultFormTemplates();

    // Step 2: Migrate existing applications  
    await migrateExistingApplications();

    console.log('Complete migration process finished successfully');
  } catch (error) {
    console.error('Error during complete migration:', error);
    throw new Error('Migration process failed');
  }
}
