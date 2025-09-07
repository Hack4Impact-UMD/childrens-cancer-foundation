import { FormTemplate, FormPage, FormField, GrantType } from '../types/form-template-types';
import { createFormTemplate } from '../backend/form-template-service';
import { Timestamp } from 'firebase/firestore';

/**
 * Script to create the 3 base application forms:
 * 1. Research Grant Application
 * 2. NextGen Grant Application  
 * 3. Non-Research Grant Application
 * 
 * Based on existing ApplicationForm.tsx and NRApplicationForm.tsx structures
 */

// Helper function to create a form field
const createField = (
  id: string,
  type: any,
  label: string,
  order: number,
  options: Partial<FormField> = {}
): FormField => ({
  id,
  type,
  label,
  order,
  required: false,
  width: 'full',
  ...options
});

// Research Grant Application Template
const createResearchGrantTemplate = (): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> => {
  const grantProposalPage: FormPage = {
    id: 'grant-proposal',
    title: 'Grant Proposal',
    description: 'Upload your complete grant proposal document',
    order: 1,
    fields: [
      createField('proposal-file', 'file', 'Grant Proposal Document', 1, {
        required: true,
        helpText: 'Please upload your complete grant proposal as a PDF file',
        validation: {
          required: true,
          customMessage: 'Grant proposal document is required'
        },
        metadata: {
          description: 'Accepted file types: PDF. Maximum size: 10MB'
        }
      })
    ],
    metadata: {
      instructions: 'Please upload your grant proposal document. This should be a comprehensive document outlining your research project.'
    }
  };

  const aboutGrantPage: FormPage = {
    id: 'about-grant',
    title: 'About the Grant',
    description: 'Basic information about your grant proposal',
    order: 2,
    fields: [
      createField('title', 'text', 'Project Title', 1, {
        required: true,
        placeholder: 'Enter the title of your research project',
        validation: {
          required: true,
          maxLength: 200
        }
      }),
      createField('amount-requested', 'currency', 'Amount Requested', 2, {
        required: true,
        placeholder: '50000',
        helpText: 'Enter the total amount you are requesting for this grant',
        validation: {
          required: true,
          min: 1000,
          max: 1000000
        }
      }),
      createField('project-dates', 'text', 'Project Timeline', 3, {
        required: true,
        placeholder: 'e.g., January 2024 - December 2024',
        helpText: 'Specify the expected start and end dates for your project'
      })
    ]
  };

  const informationPage: FormPage = {
    id: 'information',
    title: 'My Information',
    description: 'Principal Investigator and institutional information',
    order: 3,
    fields: [
      createField('principal-investigator', 'text', 'Principal Investigator Name', 1, {
        required: true,
        placeholder: 'Dr. Jane Smith',
        width: 'half'
      }),
      createField('institution', 'text', 'Institution Name', 2, {
        required: true,
        placeholder: 'University of Example',
        width: 'half'
      }),
      createField('department', 'text', 'Department', 3, {
        required: true,
        placeholder: 'Department of Oncology',
        width: 'half'
      }),
      createField('department-head', 'text', 'Department Head', 4, {
        required: true,
        placeholder: 'Dr. John Doe',
        width: 'half'
      }),
      createField('institution-address', 'text', 'Institution Address', 5, {
        required: true,
        placeholder: '123 University Ave'
      }),
      createField('institution-city-state-zip', 'text', 'City, State, ZIP', 6, {
        required: true,
        placeholder: 'Boston, MA 02115'
      }),
      createField('institution-phone', 'phone', 'Institution Phone', 7, {
        required: true,
        placeholder: '(555) 123-4567',
        width: 'half'
      }),
      createField('institution-email', 'email', 'Institution Email', 8, {
        required: true,
        placeholder: 'contact@university.edu',
        width: 'half'
      }),
      createField('cancer-types', 'textarea', 'Types of Cancer Addressed', 9, {
        required: true,
        placeholder: 'Describe the types of cancer your research will address',
        helpText: 'Please specify which cancer types your research focuses on'
      }),
      createField('admin-official-name', 'text', 'Administrative Official Name', 10, {
        required: true,
        placeholder: 'Dr. Mary Johnson',
        width: 'half'
      }),
      createField('admin-official-address', 'text', 'Administrative Official Address', 11, {
        required: true,
        placeholder: '456 Admin Building',
        width: 'half'
      }),
      createField('admin-city-state-zip', 'text', 'Admin City, State, ZIP', 12, {
        required: true,
        placeholder: 'Boston, MA 02115'
      }),
      createField('admin-phone', 'phone', 'Administrative Phone', 13, {
        required: true,
        placeholder: '(555) 987-6543',
        width: 'half'
      }),
      createField('admin-email', 'email', 'Administrative Email', 14, {
        required: true,
        placeholder: 'admin@university.edu',
        width: 'half'
      })
    ]
  };

  const applicationQuestionsPage: FormPage = {
    id: 'application-questions',
    title: 'Application Questions',
    description: 'Additional required information and certifications',
    order: 4,
    fields: [
      createField('published-paper', 'radio', 'Have you included a published paper?', 1, {
        required: true,
        options: ['Yes', 'No'],
        helpText: 'Indicate whether you have included relevant published research'
      }),
      createField('credit-agreement', 'radio', 'Do you agree to credit CCF in publications?', 2, {
        required: true,
        options: ['Yes', 'No'],
        helpText: 'Agreement to acknowledge CCF funding in any resulting publications'
      }),
      createField('patent-applied', 'radio', 'Have you applied for any patents related to this work?', 3, {
        required: true,
        options: ['Yes', 'No']
      }),
      createField('funding-info', 'radio', 'Have you included other funding information?', 4, {
        required: true,
        options: ['Yes', 'No'],
        helpText: 'Information about other funding sources for this project'
      }),
      createField('ein-number', 'text', 'EIN Number', 5, {
        required: true,
        placeholder: '12-3456789',
        helpText: 'Your institution\'s Employer Identification Number'
      }),
      createField('signature-pi', 'text', 'Principal Investigator Signature', 6, {
        required: true,
        placeholder: 'Type your full name as electronic signature'
      }),
      createField('signature-dept-head', 'text', 'Department Head Signature', 7, {
        required: true,
        placeholder: 'Type department head\'s full name as electronic signature'
      })
    ]
  };

  const reviewPage: FormPage = {
    id: 'review',
    title: 'Review and Submit',
    description: 'Review your application before submission',
    order: 5,
    fields: [
      createField('final-confirmation', 'checkbox', 'I confirm that all information provided is accurate', 1, {
        required: true,
        options: ['I confirm that all information provided is accurate and complete']
      })
    ]
  };

  return {
    name: 'Research Grant Application',
    grantType: 'research' as GrantType,
    version: 1,
    isActive: false,
    isPublished: false,
    pages: [grantProposalPage, aboutGrantPage, informationPage, applicationQuestionsPage, reviewPage],
    createdBy: 'system',
    lastModifiedBy: 'system',
    metadata: {
      description: 'Comprehensive application form for research grants focusing on cancer research projects',
      instructions: 'This application is for researchers seeking funding for cancer research projects. Please complete all sections accurately.',
      estimatedTime: 45
    }
  };
};

// NextGen Grant Application Template
const createNextGenGrantTemplate = (): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> => {
  const grantProposalPage: FormPage = {
    id: 'grant-proposal',
    title: 'Grant Proposal',
    description: 'Upload your NextGen grant proposal document',
    order: 1,
    fields: [
      createField('proposal-file', 'file', 'NextGen Grant Proposal Document', 1, {
        required: true,
        helpText: 'Please upload your NextGen grant proposal as a PDF file',
        validation: {
          required: true,
          customMessage: 'NextGen grant proposal document is required'
        },
        metadata: {
          description: 'Accepted file types: PDF. Maximum size: 10MB'
        }
      })
    ],
    metadata: {
      instructions: 'Please upload your NextGen grant proposal document. This should focus on innovative approaches to cancer research.'
    }
  };

  const aboutGrantPage: FormPage = {
    id: 'about-grant',
    title: 'About the Grant',
    description: 'Basic information about your NextGen grant proposal',
    order: 2,
    fields: [
      createField('title', 'text', 'Project Title', 1, {
        required: true,
        placeholder: 'Enter the title of your NextGen research project',
        validation: {
          required: true,
          maxLength: 200
        }
      }),
      createField('innovation-focus', 'textarea', 'Innovation Focus', 2, {
        required: true,
        placeholder: 'Describe the innovative aspects of your research approach',
        helpText: 'Explain how your project represents next-generation thinking in cancer research'
      }),
      createField('amount-requested', 'currency', 'Amount Requested', 3, {
        required: true,
        placeholder: '75000',
        helpText: 'Enter the total amount you are requesting for this NextGen grant',
        validation: {
          required: true,
          min: 1000,
          max: 1000000
        }
      }),
      createField('project-dates', 'text', 'Project Timeline', 4, {
        required: true,
        placeholder: 'e.g., March 2024 - February 2025',
        helpText: 'Specify the expected start and end dates for your project'
      })
    ]
  };

  // Use similar information and application questions pages as Research grant
  const informationPage: FormPage = {
    ...createResearchGrantTemplate().pages.find(p => p.id === 'information')!,
    id: 'information-nextgen'
  };

  const applicationQuestionsPage: FormPage = {
    ...createResearchGrantTemplate().pages.find(p => p.id === 'application-questions')!,
    id: 'application-questions-nextgen'
  };

  const reviewPage: FormPage = {
    ...createResearchGrantTemplate().pages.find(p => p.id === 'review')!,
    id: 'review-nextgen'
  };

  return {
    name: 'NextGen Grant Application',
    grantType: 'nextgen' as GrantType,
    version: 1,
    isActive: false,
    isPublished: false,
    pages: [grantProposalPage, aboutGrantPage, informationPage, applicationQuestionsPage, reviewPage],
    createdBy: 'system',
    lastModifiedBy: 'system',
    metadata: {
      description: 'Application form for NextGen grants supporting innovative cancer research approaches',
      instructions: 'This application is for researchers seeking NextGen funding for innovative cancer research approaches. Focus on novel methodologies and breakthrough potential.',
      estimatedTime: 40
    }
  };
};

// Non-Research Grant Application Template
const createNonResearchGrantTemplate = (): Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> => {
  const aboutGrantPage: FormPage = {
    id: 'about-grant',
    title: 'About the Grant',
    description: 'Basic information about your non-research grant request',
    order: 1,
    fields: [
      createField('title', 'text', 'Project/Program Title', 1, {
        required: true,
        placeholder: 'Enter the title of your project or program',
        validation: {
          required: true,
          maxLength: 200
        }
      }),
      createField('amount-requested', 'currency', 'Amount Requested', 2, {
        required: true,
        placeholder: '25000',
        helpText: 'Enter the total amount you are requesting',
        validation: {
          required: true,
          min: 500,
          max: 500000
        }
      }),
      createField('timeframe', 'text', 'Project Timeframe', 3, {
        required: true,
        placeholder: 'e.g., 6 months, 1 year',
        helpText: 'Specify the duration of your project or program'
      })
    ]
  };

  const informationPage: FormPage = {
    id: 'information',
    title: 'My Information',
    description: 'Contact and organizational information',
    order: 2,
    fields: [
      createField('requestor-name', 'text', 'Requestor Name', 1, {
        required: true,
        placeholder: 'Your full name',
        width: 'half'
      }),
      createField('organization', 'text', 'Organization/Institution', 2, {
        required: true,
        placeholder: 'Your organization name',
        width: 'half'
      }),
      createField('title-position', 'text', 'Title/Position', 3, {
        required: true,
        placeholder: 'Your role in the organization',
        width: 'half'
      }),
      createField('organization-type', 'select', 'Organization Type', 4, {
        required: true,
        options: [
          'Non-profit Organization',
          'Hospital/Medical Center',
          'Educational Institution',
          'Community Organization',
          'Patient Support Group',
          'Other'
        ],
        width: 'half'
      }),
      createField('organization-address', 'text', 'Organization Address', 5, {
        required: true,
        placeholder: '123 Main Street'
      }),
      createField('city-state-zip', 'text', 'City, State, ZIP', 6, {
        required: true,
        placeholder: 'City, State 12345'
      }),
      createField('phone-number', 'phone', 'Phone Number', 7, {
        required: true,
        placeholder: '(555) 123-4567',
        width: 'half'
      }),
      createField('email-address', 'email', 'Email Address', 8, {
        required: true,
        placeholder: 'your.email@organization.org',
        width: 'half'
      }),
      createField('website', 'url', 'Organization Website', 9, {
        placeholder: 'https://www.yourorganization.org',
        helpText: 'Optional: Your organization\'s website URL'
      }),
      createField('tax-exempt-status', 'radio', 'Tax-Exempt Status', 10, {
        required: true,
        options: ['501(c)(3)', 'Other tax-exempt', 'Not tax-exempt'],
        helpText: 'Please specify your organization\'s tax-exempt status'
      })
    ]
  };

  const narrativePage: FormPage = {
    id: 'narrative',
    title: 'Project Narrative',
    description: 'Detailed description of your project or program',
    order: 3,
    fields: [
      createField('project-description', 'textarea', 'Project Description', 1, {
        required: true,
        placeholder: 'Provide a detailed description of your project or program...',
        helpText: 'Describe what you plan to do, who will benefit, and how it relates to cancer support or awareness',
        validation: {
          required: true,
          minLength: 100,
          maxLength: 2000
        }
      }),
      createField('target-population', 'textarea', 'Target Population', 2, {
        required: true,
        placeholder: 'Describe who will benefit from this project...',
        helpText: 'Specify the demographics, size, and characteristics of your target audience',
        validation: {
          required: true,
          minLength: 50,
          maxLength: 1000
        }
      }),
      createField('expected-outcomes', 'textarea', 'Expected Outcomes', 3, {
        required: true,
        placeholder: 'What outcomes do you expect to achieve?',
        helpText: 'Describe the measurable outcomes and impact you expect from this project',
        validation: {
          required: true,
          minLength: 50,
          maxLength: 1000
        }
      }),
      createField('budget-breakdown', 'textarea', 'Budget Breakdown', 4, {
        required: true,
        placeholder: 'Provide a breakdown of how funds will be used...',
        helpText: 'Detail how the requested funds will be allocated across different expense categories',
        validation: {
          required: true,
          minLength: 50,
          maxLength: 1000
        }
      }),
      createField('other-funding', 'textarea', 'Other Funding Sources', 5, {
        placeholder: 'List any other funding sources for this project...',
        helpText: 'Optional: Describe any other grants, donations, or funding sources for this project'
      }),
      createField('additional-info', 'textarea', 'Additional Information', 6, {
        placeholder: 'Any additional information you would like to provide...',
        helpText: 'Optional: Include any other relevant information about your project or organization'
      }),
      createField('supporting-documents', 'file', 'Supporting Documents', 7, {
        required: true,
        helpText: 'Upload supporting documents (budget details, organizational documents, etc.)',
        metadata: {
          description: 'Accepted file types: PDF, DOC, DOCX. Maximum size: 10MB'
        }
      })
    ]
  };

  const reviewPage: FormPage = {
    id: 'review',
    title: 'Review and Submit',
    description: 'Review your application before submission',
    order: 4,
    fields: [
      createField('certification', 'checkbox', 'Certification', 1, {
        required: true,
        options: [
          'I certify that all information provided is true and accurate',
          'I understand that false information may result in disqualification',
          'I agree to provide reports on the use of funds if awarded'
        ],
        helpText: 'Please confirm all certifications before submitting'
      })
    ]
  };

  return {
    name: 'Non-Research Grant Application',
    grantType: 'nonresearch' as GrantType,
    version: 1,
    isActive: false,
    isPublished: false,
    pages: [aboutGrantPage, informationPage, narrativePage, reviewPage],
    createdBy: 'system',
    lastModifiedBy: 'system',
    metadata: {
      description: 'Application form for non-research grants supporting cancer-related programs and initiatives',
      instructions: 'This application is for organizations seeking funding for non-research cancer-related programs, support services, or awareness initiatives.',
      estimatedTime: 30
    }
  };
};

// Main function to create all base forms
export const createAllBaseForms = async (): Promise<void> => {
  try {
    console.log('Creating base application forms...');

    // Create Research Grant Template
    console.log('Creating Research Grant template...');
    const researchTemplate = createResearchGrantTemplate();
    await createFormTemplate(researchTemplate, 'system');
    console.log('✅ Research Grant template created');

    // Create NextGen Grant Template
    console.log('Creating NextGen Grant template...');
    const nextgenTemplate = createNextGenGrantTemplate();
    await createFormTemplate(nextgenTemplate, 'system');
    console.log('✅ NextGen Grant template created');

    // Create Non-Research Grant Template
    console.log('Creating Non-Research Grant template...');
    const nonResearchTemplate = createNonResearchGrantTemplate();
    await createFormTemplate(nonResearchTemplate, 'system');
    console.log('✅ Non-Research Grant template created');

    console.log('🎉 All base forms created successfully!');
    
    console.log('\nCreated Forms:');
    console.log('1. Research Grant Application (5 pages, 20+ fields)');
    console.log('2. NextGen Grant Application (5 pages, 20+ fields)');
    console.log('3. Non-Research Grant Application (4 pages, 15+ fields)');
    
  } catch (error) {
    console.error('❌ Error creating base forms:', error);
    throw error;
  }
};

// Export individual template creators for flexibility
export {
  createResearchGrantTemplate,
  createNextGenGrantTemplate,
  createNonResearchGrantTemplate
};
