# PostGrantReport

This page allows applicants with accepted grant applications to submit their post-grant reports.

## Logic

- **Access Control**: Only applicants with accepted applications can access this page
- **Deadline Display**: Shows the deadline for submitting post-grant reports and indicates if overdue
- **File Upload**: Allows PDF file upload for the post-grant report
- **Form Validation**: Requires investigator name, institution name, and attestation date
- **Status Tracking**: Tracks submission status and stores data in Firebase

## Features

### Deadline Management
- Displays the post-grant report deadline set by administrators
- Shows overdue warning if the deadline has passed
- Deadline information is pulled from the current application cycle

### File Upload
- Accepts only PDF files
- Shows file name when uploaded
- Allows file removal and re-upload
- Validates file format

### Form Fields
- **Investigator Name**: Full legal name of the principal investigator
- **Institution Name**: Name of the institution
- **Attestation Date**: Date of submission/attestation
- All fields are required for submission

### Submission Process
- **Save Progress**: Saves current form state (TODO: implement)
- **Save and Submit**: Submits the complete report to Firebase
- **Validation**: Ensures all required fields are filled and file is uploaded
- **Success Feedback**: Shows confirmation message on successful submission

## Data Flow

1. **Initialization**: 
   - Loads current application cycle data
   - Checks if user has accepted applications
   - Sets deadline and overdue status

2. **Form Interaction**:
   - User uploads PDF file
   - User fills in required form fields
   - Form validates input

3. **Submission**:
   - File is uploaded to Firebase Storage
   - Form data is saved to Firestore
   - Success message is displayed
   - Form is reset

## Related Components

- **Sidebar**: Shows "Post-Grant Report" link for users with accepted applications
- **Admin Dashboard**: Allows setting post-grant report deadlines
- **Application Cycle**: Contains deadline information
