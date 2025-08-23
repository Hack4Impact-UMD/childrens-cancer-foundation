# Children's Cancer Foundation - System Documentation

## Overview
The Children's Cancer Foundation (CCF) grant management system is a comprehensive web application built with React, TypeScript, and Firebase. It manages the entire grant application lifecycle from submission to post-grant reporting.

## Key Features

### Grant Application Management
- **Multi-Type Applications**: Support for Research, NextGen, and Non-Research grants
- **Application Cycles**: Configurable application periods with deadlines
- **Decision Management**: Admin-controlled acceptance/rejection process
- **Review System**: Reviewer assignment and evaluation workflow

### Post-Grant Reporting System
- **Full-Screen Report Pages**: Dedicated pages for post-grant report submission
- **Dashboard Integration**: Comprehensive post-grant report management in applicant dashboard
- **PDF Management**: Secure file upload, storage, and viewing capabilities
- **Deadline Tracking**: Automatic deadline management with overdue warnings
- **Submission Confirmation**: Detailed submission information with PDF viewing
- **Visual Status Indicators**: Clear visual feedback for report submission status

### User Role Management
- **Applicants**: Submit applications and post-grant reports
- **Reviewers**: Evaluate applications and provide feedback
- **Administrators**: Manage cycles, users, system configuration, and reviewer whitelist

### Security & Authentication
- **Firebase Authentication**: Secure user authentication and role management
- **Firestore Security Rules**: Comprehensive data access controls
- **Storage Security**: Secure file upload and access controls

## System Architecture

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with comprehensive interfaces
- **React Router**: Client-side routing with protected routes
- **CSS Modules**: Scoped styling for components

### Backend (Firebase)
- **Firestore**: NoSQL database for application and user data
- **Firebase Storage**: Secure file storage for PDF uploads
- **Firebase Authentication**: User authentication and role management
- **Firebase Functions**: Serverless backend functions

### Key Collections
- **applications**: Grant application data
- **post-grant-reports**: Post-grant report submissions
- **applicationCycles**: Application cycle configuration
- **decisions**: Application decision data
- **users**: User account information
- **FAQs**: Frequently asked questions and answers
- **reviewer-whitelist**: Reviewer email whitelist for account creation

## Recent Updates

### v2.0 - Post-Grant Report System Enhancement
- **Full-Screen Implementation**: Replaced modal-based reports with dedicated pages
- **Dashboard Integration**: Comprehensive post-grant report management
- **PDF Viewing**: Direct PDF access with proper URL handling
- **Visual Status Indicators**: Green/blue button states for report status
- **Deadline Management**: Enhanced deadline display with overdue warnings
- **Submission Confirmation**: Detailed submission information display
- **Error Handling**: Improved error handling and user feedback

### v1.5 - Application Management Improvements
- **Enhanced Dashboard**: Better application status display
- **Decision Integration**: Improved decision-based filtering
- **User Experience**: Better loading states and error handling

### v1.0 - Initial Implementation
- **Basic Application System**: Core grant application functionality
- **User Authentication**: Role-based access control
- **Review System**: Basic reviewer workflow

### v1.1 - FAQ System Enhancement
- **FAQ Integration Fix**: Resolved empty FAQ display in applicant dashboard
- **Dynamic FAQ Loading**: Implemented Firebase-based FAQ data fetching
- **Sample Data Initialization**: Added admin tools for populating FAQ database
- **Markdown Support**: Enhanced FAQ answers with rich text formatting
- **Empty State Handling**: Improved user experience when no FAQs are available
- **Debugging Capabilities**: Added comprehensive logging for troubleshooting
- **New FAQ Creation**: Added form-based interface for creating new FAQ entries
- **Auto-Generated IDs**: Implemented automatic ID generation for new FAQs
- **Form Validation**: Added validation for required question and answer fields

### v1.2 - Reviewer Whitelist Management
- **Whitelist System**: Added reviewer email whitelist for secure account creation
- **Admin Management**: Comprehensive admin interface for managing whitelist entries
- **Search and Filter**: Advanced search and filtering capabilities for whitelist entries
- **Security Enhancement**: Prevents unauthorized reviewer account creation
- **Integration**: Seamless integration with existing reviewer account creation flow

## Post-Grant Report System

### Features
- **Application-Specific Reports**: Each accepted application requires its own report
- **Full-Screen Interface**: Dedicated pages with sidebar navigation
- **PDF Upload & Viewing**: Secure file handling with direct viewing
- **Deadline Management**: Automatic deadline tracking and warnings
- **Submission Confirmation**: Comprehensive submission details
- **Visual Status Tracking**: Clear indicators for report completion

### User Flow
1. **Dashboard View**: Applicants see accepted applications needing reports
2. **Report Submission**: Click "Submit Report" to access full-screen form
3. **Form Completion**: Upload PDF and fill attestation information
4. **Submission**: Confetti animation and automatic dashboard return
5. **Status Update**: Dashboard shows green "Report Already Submitted ✓" button
6. **PDF Viewing**: Direct access to submitted PDFs from dashboard

### Technical Implementation
- **Route**: `/applicant/post-grant-report/:applicationId`
- **Storage**: PDFs stored in Firebase Storage under `pdfs/` directory
- **Database**: Report metadata stored in `post-grant-reports` collection
- **Security**: Comprehensive Firestore and Storage security rules
- **URL Handling**: `getPDFDownloadURL()` function for file ID to URL conversion

## Documentation Structure

### Firebase Documentation
- **firebase-functions/**: Serverless function documentation
- **firestore/**: Database collection and security rule documentation
- **faq-handler.md**: FAQ management backend functions

### React Application Documentation
- **react-app/components/**: Reusable component documentation
- **react-app/pages/**: Page component documentation
- **react-app/backend/**: Backend service documentation

### System Documentation
- **README.md**: This overview document
- **Architecture**: System design and data flow documentation

## Getting Started

### Prerequisites
- Node.js 16+
- Firebase CLI
- Firebase project setup

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Firebase: `firebase init`
4. Deploy security rules: `firebase deploy --only firestore:rules,storage`
5. Start development server: `npm start`

### Deployment
1. Build the application: `npm run build`
2. Deploy to Firebase: `firebase deploy`

## Security Considerations

### Firestore Rules
- Role-based access control for all collections
- User-specific data access for applicants
- Admin access to all data
- Proper validation for data creation and updates

### Storage Rules
- PDF file type validation
- File size limits (50MB)
- Authenticated user access only
- Secure download URL generation

### Authentication
- Firebase Authentication with custom claims
- Role-based route protection
- Session management and token refresh

## Support and Maintenance

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Graceful degradation for missing data
- Loading states and feedback

### Performance
- Lazy loading for components
- Optimized Firebase queries
- Efficient state management
- Responsive design for all devices

### Monitoring
- Firebase Analytics integration
- Error tracking and logging
- Performance monitoring
- User behavior analytics
