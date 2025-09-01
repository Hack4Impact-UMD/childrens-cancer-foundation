# Post-Grant Reports Collection

## Overview
The `post-grant-reports` collection stores post-grant report submissions for accepted applications. Each report is linked to a specific application and user.

## Schema

### Document Structure
```typescript
interface PostGrantReport {
    id?: string;                    // Auto-generated document ID
    file?: string;                  // PDF file ID (legacy support)
    pdf?: string;                   // PDF file ID from Firebase Storage
    applicationId: string;          // ID of the associated application
    submittedAt?: Date;             // Timestamp when report was submitted
    deadline?: Date;                // Report deadline (from application cycle)
    investigatorName?: string;      // Principal investigator name
    institutionName?: string;       // Institution name
    attestationDate?: string;       // Date of attestation
    status?: 'pending' | 'submitted' | 'overdue';  // Report status
    userId?: string;                // User ID who submitted the report
    userEmail?: string;             // Email of the submitting user
    applicationTitle?: string;      // Title of the associated application
    grantType?: string;             // Type of grant (research, nextgen, nonresearch)
}
```

## Usage

### Creating Reports
- **Trigger**: User submits post-grant report through the full-screen form
- **Location**: `/applicant/post-grant-report/:applicationId`
- **Process**: 
  1. PDF file uploaded to Firebase Storage
  2. File ID stored in `pdf` field
  3. Report document created with user authentication
  4. Confetti animation shown on success

### Reading Reports
- **Applicants**: Can read their own reports (where `userId` matches `request.auth.uid`)
- **Admins**: Can read all reports for administrative purposes
- **Dashboard**: Shows submission details and PDF viewing links

### Updating Reports
- **Applicants**: Can update their own reports
- **Admins**: Can update any report
- **Note**: Once submitted, reports cannot be edited by applicants (read-only view)

## Security Rules

### Firestore Rules
```javascript
match /post-grant-reports/{reportId} {
  // Allow applicants to create their own reports
  allow create: if isApplicant() && 
    request.resource.data.userId == request.auth.uid;
  
  // Allow applicants to read their own reports
  allow read: if isApplicant() && 
    resource.data.userId == request.auth.uid;
  
  // Allow applicants to update their own reports
  allow update: if isApplicant() && 
    resource.data.userId == request.auth.uid;
  
  // Allow admins to read and update all reports
  allow read, update: if isAdmin();
}
```

### Storage Rules
```javascript
match /pdfs/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
    && request.resource.size < 50 * 1024 * 1024
    && request.resource.contentType.matches('application/pdf');
}
```

## Related Collections

### Application Cycles
- Contains `postGrantReportDeadline` field
- Used to determine report deadlines and overdue status

### Applications
- Linked via `applicationId` field
- Used to verify application acceptance status

### Users
- Linked via `userId` field
- Used for authentication and ownership verification

## Key Features

### Dashboard Integration
- **Post-Grant Reports Required**: Shows accepted applications needing reports
- **Submitted Reports**: Shows completed reports with submission details
- **Visual Indicators**: Green "Report Already Submitted ✓" buttons for completed reports
- **Deadline Information**: Displays submission deadlines with overdue warnings

### Full-Screen Report Page
- **Application Context**: Shows which application the report is for
- **Deadline Display**: Shows submission deadline with overdue warnings
- **PDF Upload**: File upload with validation and preview
- **Attestation Form**: Investigator, institution, and date fields
- **Submission Confirmation**: Shows detailed submission information
- **PDF Viewing**: Direct links to view submitted PDFs

### PDF Management
- **Storage**: PDFs stored in Firebase Storage under `pdfs/` directory
- **URL Generation**: `getPDFDownloadURL()` function converts file IDs to download URLs
- **Viewing**: PDFs open in new tabs with proper security attributes
- **File Validation**: 50MB size limit, PDF format only

## Error Handling

### Common Issues
- **Permission Errors**: Fixed with proper Firestore security rules
- **File ID Mismatch**: Supports both `pdf` and `file` field names
- **Timestamp Issues**: Proper handling of Firestore timestamp objects
- **Missing Files**: Graceful fallbacks for missing PDF URLs

### User Feedback
- **Loading States**: "Loading PDF..." while fetching URLs
- **Error Messages**: Clear error messages for failed operations
- **Success Indicators**: Confetti animation and confirmation pages

## Recent Updates

### v2.0 - Full-Screen Implementation
- Replaced modal with full-screen post-grant report page
- Added sidebar navigation to report pages
- Implemented PDF URL fetching from file IDs
- Added submission confirmation with detailed information
- Fixed field name compatibility issues

### v1.5 - Dashboard Integration
- Integrated post-grant reports into applicant dashboard
- Added deadline information display
- Implemented visual status indicators
- Added PDF viewing functionality

### v1.0 - Initial Implementation
- Basic post-grant report submission
- Modal-based form interface
- Firebase Storage integration
- Basic security rules
