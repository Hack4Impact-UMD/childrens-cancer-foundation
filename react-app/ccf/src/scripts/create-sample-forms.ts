/**
 * Script to create sample application forms based on the existing form structures
 * Run this script to populate the database with default form templates
 */

import { createFormTemplate } from '../backend/form-template-service';
import { FormTemplate, GrantType } from '../types/form-template-types';

/**
 * Create Research Grant Form Template
 */
function createResearchGrantTemplate(): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Research Grant Application Form',
    grantType: 'research' as GrantType,
    version: 1,
    isActive: true,
    isPublished: true,
    createdBy: 'system',
    lastModifiedBy: 'system',
    pages: [
      {
        id: 'grant-proposal',
        title: 'Grant Proposal',
        description: 'Upload your complete grant proposal document',
        order: 1,
        fields: [
          {
            id: 'file',
            type: 'file',
            label: 'Grant Proposal Document (PDF)',
            placeholder: '',
            required: true,
            order: 1,
            width: 'full',
            helpText: 'Please upload your complete grant proposal as a PDF file (max 10MB)'
          }
        ],
        metadata: {
          instructions: 'Please upload your complete grant proposal document. This should include your research objectives, methodology, timeline, and budget.'
        }
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
            placeholder: '50000',
            required: true,
            order: 1,
            width: 'half',
            validation: {
              min: 1000,
              max: 500000
            },
            helpText: 'Enter the total amount you are requesting for this research project'
          },
          {
            id: 'dates',
            type: 'text',
            label: 'Project Timeline',
            placeholder: 'e.g., 12 months, January 2024 - December 2024',
            required: true,
            order: 2,
            width: 'half',
            helpText: 'Specify the duration and timeline for your research project'
          },
          {
            id: 'continuation',
            type: 'radio',
            label: 'Is this a continuation of previous work?',
            required: true,
            order: 3,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'continuation_years',
            type: 'text',
            label: 'If yes, how many years have you been working on this?',
            placeholder: 'e.g., 2 years',
            required: false,
            order: 4,
            width: 'half',
            conditionalLogic: {
              dependsOn: 'continuation',
              showWhen: 'Yes'
            }
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
            id: 'institution_city_state_zip',
            type: 'text',
            label: 'City, State, ZIP',
            placeholder: 'City, State ZIP',
            required: true,
            order: 7,
            width: 'half'
          },
          {
            id: 'institution_phone',
            type: 'phone',
            label: 'Institution Phone',
            placeholder: '(123) 456-7890',
            required: true,
            order: 8,
            width: 'half'
          },
          {
            id: 'institution_email',
            type: 'email',
            label: 'Institution Email',
            placeholder: 'institution@example.com',
            required: true,
            order: 9,
            width: 'half'
          },
          {
            id: 'types_of_cancer',
            type: 'textarea',
            label: 'Types of Cancer Addressed',
            placeholder: 'Describe the types of cancer your research addresses',
            required: true,
            order: 10,
            width: 'full',
            helpText: 'Please specify which types of cancer your research will focus on'
          },
          {
            id: 'admin_official_name',
            type: 'text',
            label: 'Administrative Official Name',
            placeholder: 'Enter administrative official name',
            required: true,
            order: 11,
            width: 'half'
          },
          {
            id: 'admin_official_address',
            type: 'textarea',
            label: 'Administrative Official Address',
            placeholder: 'Enter administrative official address',
            required: true,
            order: 12,
            width: 'full'
          },
          {
            id: 'admin_official_city_state_zip',
            type: 'text',
            label: 'Admin Official City, State, ZIP',
            placeholder: 'City, State ZIP',
            required: true,
            order: 13,
            width: 'half'
          },
          {
            id: 'admin_phone',
            type: 'phone',
            label: 'Administrative Phone',
            placeholder: '(123) 456-7890',
            required: true,
            order: 14,
            width: 'half'
          },
          {
            id: 'admin_email',
            type: 'email',
            label: 'Administrative Email',
            placeholder: 'admin@example.com',
            required: true,
            order: 15,
            width: 'half'
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
            id: 'included_published_paper',
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
            label: 'Do you agree to credit the Children\'s Cancer Foundation in any publication resulting from this grant?',
            required: true,
            order: 2,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'patent_applied',
            type: 'radio',
            label: 'Have you applied for any patents related to this research?',
            required: true,
            order: 3,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'included_funding_info',
            type: 'radio',
            label: 'Have you included information about other funding sources?',
            required: true,
            order: 4,
            width: 'full',
            options: ['Yes', 'No']
          },
          {
            id: 'ein_number',
            type: 'text',
            label: 'EIN Number',
            placeholder: 'Enter your institution\'s EIN number',
            required: true,
            order: 5,
            width: 'half',
            validation: {
              pattern: '^[0-9]{2}-[0-9]{7}$',
              customMessage: 'Please enter EIN in format: XX-XXXXXXX'
            }
          },
          {
            id: 'attestation_human_subjects',
            type: 'checkbox',
            label: 'I attest that this research involves human subjects',
            required: false,
            order: 6,
            width: 'full',
            options: ['This research involves human subjects and has IRB approval']
          },
          {
            id: 'attestation_certification',
            type: 'checkbox',
            label: 'I certify that all information provided is accurate',
            required: true,
            order: 7,
            width: 'full',
            options: ['I certify that all information provided in this application is true and accurate']
          },
          {
            id: 'signature_pi',
            type: 'text',
            label: 'Principal Investigator Signature',
            placeholder: 'Type your full name as electronic signature',
            required: true,
            order: 8,
            width: 'half',
            helpText: 'By typing your name, you are providing an electronic signature'
          },
          {
            id: 'signature_dept_head',
            type: 'text',
            label: 'Department Head Signature',
            placeholder: 'Department head types their full name',
            required: true,
            order: 9,
            width: 'half',
            helpText: 'Department head electronic signature'
          }
        ]
      }
    ],
    metadata: {
      description: 'Comprehensive research grant application form for scientific research projects',
      instructions: 'Please complete all sections of this form thoroughly. Ensure you have your research proposal document ready for upload before beginning.',
      estimatedTime: 45,
      category: 'Research',
      tags: ['research', 'grant', 'scientific']
    }
  };
}

/**
 * Create NextGen Grant Form Template
 */
function createNextGenGrantTemplate(): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  const researchTemplate = createResearchGrantTemplate();
  return {
    ...researchTemplate,
    name: 'NextGen Grant Application Form',
    grantType: 'nextgen' as GrantType,
    metadata: {
      ...researchTemplate.metadata,
      description: 'NextGen grant application form designed for early-career researchers and innovative projects',
      instructions: 'This form is specifically designed for NextGen grants supporting emerging researchers. Please provide detailed information about your innovative research approach and career development goals.',
      category: 'NextGen',
      tags: ['nextgen', 'emerging-researcher', 'innovation']
    }
  };
}

/**
 * Create Non-Research Grant Form Template
 */
function createNonResearchGrantTemplate(): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Non-Research Grant Application Form',
    grantType: 'nonresearch' as GrantType,
    version: 1,
    isActive: true,
    isPublished: true,
    createdBy: 'system',
    lastModifiedBy: 'system',
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
            placeholder: '10000',
            required: true,
            order: 2,
            width: 'half',
            validation: {
              min: 500,
              max: 100000
            }
          },
          {
            id: 'timeframe',
            type: 'text',
            label: 'Project Timeframe',
            placeholder: 'e.g., 6 months, Spring 2024',
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
            label: 'Organization/Institution',
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
        description: 'Provide detailed information about your project',
        order: 3,
        fields: [
          {
            id: 'explanation',
            type: 'textarea',
            label: 'Project Explanation',
            placeholder: 'Provide a detailed explanation of your project, its goals, and expected outcomes',
            required: true,
            order: 1,
            width: 'full',
            validation: {
              minLength: 100,
              maxLength: 2000
            },
            helpText: 'Please describe your project in detail (100-2000 characters)'
          },
          {
            id: 'sources',
            type: 'textarea',
            label: 'Sources and References',
            placeholder: 'List any sources, references, or supporting documentation for your project',
            required: false,
            order: 2,
            width: 'full',
            validation: {
              maxLength: 1000
            }
          },
          {
            id: 'additional_info',
            type: 'textarea',
            label: 'Additional Information',
            placeholder: 'Any additional information you would like to provide about your project',
            required: false,
            order: 3,
            width: 'full',
            validation: {
              maxLength: 1000
            }
          },
          {
            id: 'file',
            type: 'file',
            label: 'Supporting Document',
            placeholder: '',
            required: true,
            order: 4,
            width: 'full',
            helpText: 'Please upload a PDF document with additional project details, budget breakdown, or supporting materials'
          }
        ]
      }
    ],
    metadata: {
      description: 'Application form for non-research grants supporting community programs, education, and support services',
      instructions: 'Please complete all sections of this form to apply for a non-research grant. This form is designed for projects that support children with cancer through programs, services, or educational initiatives.',
      estimatedTime: 30,
      category: 'Non-Research',
      tags: ['non-research', 'community', 'support', 'education']
    }
  };
}

/**
 * Main function to create all sample forms
 */
export async function createSampleForms(): Promise<void> {
  try {
    console.log('Creating sample form templates...');

    // Create Research Grant Template
    console.log('Creating Research Grant Template...');
    const researchTemplate = createResearchGrantTemplate();
    const researchId = await createFormTemplate(researchTemplate, 'system-script');
    console.log(`✅ Research Grant Template created with ID: ${researchId}`);

    // Create NextGen Grant Template
    console.log('Creating NextGen Grant Template...');
    const nextgenTemplate = createNextGenGrantTemplate();
    const nextgenId = await createFormTemplate(nextgenTemplate, 'system-script');
    console.log(`✅ NextGen Grant Template created with ID: ${nextgenId}`);

    // Create Non-Research Grant Template
    console.log('Creating Non-Research Grant Template...');
    const nonresearchTemplate = createNonResearchGrantTemplate();
    const nonresearchId = await createFormTemplate(nonresearchTemplate, 'system-script');
    console.log(`✅ Non-Research Grant Template created with ID: ${nonresearchId}`);

    console.log('🎉 All sample form templates created successfully!');
    console.log('\nTemplate IDs:');
    console.log(`- Research: ${researchId}`);
    console.log(`- NextGen: ${nextgenId}`);
    console.log(`- Non-Research: ${nonresearchId}`);

  } catch (error) {
    console.error('❌ Error creating sample forms:', error);
    throw error;
  }
}

/**
 * Function to run the script
 */
export async function runSampleFormsScript(): Promise<void> {
  try {
    await createSampleForms();
  } catch (error) {
    console.error('Script failed:', error);
    throw error;
  }
}
