#!/usr/bin/env node

/**
 * Standalone Node.js script to create base application forms
 * Can be run from command line: node run-base-forms-creation.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (you may need to adjust the path to your service account key)
const serviceAccount = require('../../../../serviceAccountKey.json'); // Adjust path as needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add your project configuration here if needed
});

const db = admin.firestore();

// Form template structure (simplified for Node.js)
const createResearchGrantTemplate = () => ({
  name: 'Research Grant Application',
  description: 'Comprehensive application form for research grants focusing on cancer research projects',
  grantType: 'Research',
  version: 1,
  status: 'draft',
  isActive: false,
  pages: [
    {
      id: 'grant-proposal',
      title: 'Grant Proposal',
      description: 'Upload your complete grant proposal document',
      order: 1,
      fields: [
        {
          id: 'proposal-file',
          type: 'file',
          label: 'Grant Proposal Document',
          order: 1,
          required: true,
          width: 'full',
          helpText: 'Please upload your complete grant proposal as a PDF file',
          validation: { required: true },
          metadata: { acceptedTypes: '.pdf', maxSize: '10MB' }
        }
      ]
    },
    {
      id: 'about-grant',
      title: 'About the Grant',
      description: 'Basic information about your grant proposal',
      order: 2,
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Project Title',
          order: 1,
          required: true,
          width: 'full',
          placeholder: 'Enter the title of your research project'
        },
        {
          id: 'amount-requested',
          type: 'currency',
          label: 'Amount Requested',
          order: 2,
          required: true,
          width: 'full',
          placeholder: '50000'
        }
      ]
    },
    // Add more pages as needed...
  ],
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: 'system',
  updatedBy: 'system',
  metadata: {
    instructions: 'This application is for researchers seeking funding for cancer research projects.',
    estimatedTime: 45,
    description: 'Research Grant Application Form'
  }
});

const createNextGenGrantTemplate = () => ({
  name: 'NextGen Grant Application',
  description: 'Application form for NextGen grants supporting innovative cancer research approaches',
  grantType: 'NextGen',
  version: 1,
  status: 'draft',
  isActive: false,
  pages: [
    {
      id: 'grant-proposal',
      title: 'Grant Proposal',
      description: 'Upload your NextGen grant proposal document',
      order: 1,
      fields: [
        {
          id: 'proposal-file',
          type: 'file',
          label: 'NextGen Grant Proposal Document',
          order: 1,
          required: true,
          width: 'full',
          helpText: 'Please upload your NextGen grant proposal as a PDF file'
        }
      ]
    },
    {
      id: 'about-grant',
      title: 'About the Grant',
      description: 'Basic information about your NextGen grant proposal',
      order: 2,
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Project Title',
          order: 1,
          required: true,
          width: 'full',
          placeholder: 'Enter the title of your NextGen research project'
        },
        {
          id: 'innovation-focus',
          type: 'textarea',
          label: 'Innovation Focus',
          order: 2,
          required: true,
          width: 'full',
          placeholder: 'Describe the innovative aspects of your research approach'
        }
      ]
    }
  ],
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: 'system',
  updatedBy: 'system',
  metadata: {
    instructions: 'This application is for researchers seeking NextGen funding for innovative cancer research approaches.',
    estimatedTime: 40,
    description: 'NextGen Grant Application Form'
  }
});

const createNonResearchGrantTemplate = () => ({
  name: 'Non-Research Grant Application',
  description: 'Application form for non-research grants supporting cancer-related programs and initiatives',
  grantType: 'Non-Research',
  version: 1,
  status: 'draft',
  isActive: false,
  pages: [
    {
      id: 'about-grant',
      title: 'About the Grant',
      description: 'Basic information about your non-research grant request',
      order: 1,
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Project/Program Title',
          order: 1,
          required: true,
          width: 'full',
          placeholder: 'Enter the title of your project or program'
        },
        {
          id: 'amount-requested',
          type: 'currency',
          label: 'Amount Requested',
          order: 2,
          required: true,
          width: 'full',
          placeholder: '25000'
        }
      ]
    },
    {
      id: 'information',
      title: 'My Information',
      description: 'Contact and organizational information',
      order: 2,
      fields: [
        {
          id: 'requestor-name',
          type: 'text',
          label: 'Requestor Name',
          order: 1,
          required: true,
          width: 'half',
          placeholder: 'Your full name'
        },
        {
          id: 'organization',
          type: 'text',
          label: 'Organization/Institution',
          order: 2,
          required: true,
          width: 'half',
          placeholder: 'Your organization name'
        }
      ]
    }
  ],
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: 'system',
  updatedBy: 'system',
  metadata: {
    instructions: 'This application is for organizations seeking funding for non-research cancer-related programs.',
    estimatedTime: 30,
    description: 'Non-Research Grant Application Form'
  }
});

const createAllBaseForms = async () => {
  try {
    console.log('🚀 Starting base forms creation...');

    // Create Research Grant Template
    console.log('📝 Creating Research Grant template...');
    const researchTemplate = createResearchGrantTemplate();
    await db.collection('formTemplates').add(researchTemplate);
    console.log('✅ Research Grant template created');

    // Create NextGen Grant Template
    console.log('📝 Creating NextGen Grant template...');
    const nextgenTemplate = createNextGenGrantTemplate();
    await db.collection('formTemplates').add(nextgenTemplate);
    console.log('✅ NextGen Grant template created');

    // Create Non-Research Grant Template
    console.log('📝 Creating Non-Research Grant template...');
    const nonResearchTemplate = createNonResearchGrantTemplate();
    await db.collection('formTemplates').add(nonResearchTemplate);
    console.log('✅ Non-Research Grant template created');

    console.log('\n🎉 All base forms created successfully!');
    console.log('\nCreated Forms:');
    console.log('1. Research Grant Application');
    console.log('2. NextGen Grant Application');
    console.log('3. Non-Research Grant Application');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating base forms:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  createAllBaseForms();
}

module.exports = { createAllBaseForms };
