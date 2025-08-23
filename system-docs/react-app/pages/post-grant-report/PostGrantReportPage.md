# Post-Grant Report Page

## Overview
The Post-Grant Report Page (`PostGrantReportPage.tsx`) is a full-screen page that allows applicants to submit post-grant reports for their accepted applications. It replaces the previous modal-based approach with a comprehensive, sidebar-enabled interface.

## Location
- **Route**: `/applicant/post-grant-report/:applicationId`
- **File**: `src/pages/post-grant-report/PostGrantReportPage.tsx`
- **Protected**: Applicant authentication required

## Features

### Application Context
- **Dynamic Application Loading**: Fetches application details based on URL parameter
- **Application Information Display**: Shows application title and grant type
- **Acceptance Verification**: Ensures only accepted applications can have reports submitted

### Deadline Management
- **Deadline Display**: Shows post-grant report deadline from application cycle
- **Overdue Warnings**: Visual indicators when deadline has passed
- **Dynamic Status**: Updates based on current date vs deadline

### PDF Upload System
- **File Validation**: PDF format only, 50MB size limit
- **Upload Interface**: Drag-and-drop style upload area
- **File Preview**: Shows selected file name with remove option
- **Error Handling**: Clear feedback for invalid files

### Attestation Form
- **Investigator Name**: Principal investigator's full legal name
- **Institution Name**: Institution where research was conducted
- **Attestation Date**: Date of report preparation
- **Form Validation**: All fields required before submission

### Submission Process
- **Multi-step Validation**: File upload, form completion, and authentication
- **Firebase Integration**: Uploads to Storage, saves metadata to Firestore
- **Success Animation**: Confetti celebration on successful submission
- **Automatic Redirect**: Returns to dashboard after submission

### Read-Only Mode
- **Submission Detection**: Checks if report already submitted
- **Detailed View**: Shows comprehensive submission details
- **PDF Viewing**: Direct link to view submitted PDF
- **No Editing**: Prevents modification of submitted reports

## State Management

### Core State Variables
```typescript
const [sidebarItems, setSidebarItems] = useState<any[]>([]);
const [uploadLabel, setUploadLabel] = useState<string>("Click to Upload");
const [reportUploaded, setReportUploaded] = useState<boolean>(false);
const [report, setReport] = useState<File | null>(null);
const [currentCycle, setCurrentCycle] = useState<ApplicationCycle | null>(null);
const [deadline, setDeadline] = useState<Date | null>(null);
const [isOverdue, setIsOverdue] = useState<boolean>(false);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [application, setApplication] = useState<Application | null>(null);
const [showConfetti, setShowConfetti] = useState<boolean>(false);
const [submittedReport, setSubmittedReport] = useState<PostGrantReport | null>(null);
const [pdfUrl, setPdfUrl] = useState<string>('');
const [formData, setFormData] = useState({
    investigatorName: "",
    institutionName: "",
    attestationDate: ""
});
```

### Form Data Structure
```typescript
interface FormData {
    investigatorName: string;
    institutionName: string;
    attestationDate: string;
}
```

## Key Functions

### `initializeData()`
- **Purpose**: Loads all necessary data on component mount
- **Process**:
  1. Loads sidebar items for navigation
  2. Fetches application details by ID
  3. Verifies application acceptance status
  4. Checks for existing submitted report
  5. Loads application cycle and deadline information
  6. Fetches PDF download URL if report exists

### `updateReport(files: FileList)`
- **Purpose**: Handles file upload selection
- **Validation**: Ensures single PDF file selection
- **UI Updates**: Updates upload label and preview

### `handleSubmit()`
- **Purpose**: Processes report submission
- **Validation**: Checks file upload and form completion
- **Submission**: Calls `writePostGrantReport` with all data
- **Success**: Shows confetti and redirects to dashboard

### `formatDate(dateString: string | Date | undefined | null)`
- **Purpose**: Safely formats dates for display
- **Handles**: String dates, Date objects, Firestore timestamps
- **Fallbacks**: Returns 'N/A' for invalid/missing dates

## Error Handling

### Loading States
- **Initial Loading**: Shows "Loading..." while fetching data
- **PDF Loading**: Shows "Loading PDF..." while fetching download URL
- **Submission Loading**: Shows "Submitting..." during form submission

### Error States
- **Application Not Found**: Clear error message with back button
- **Not Accepted**: Explains why report cannot be submitted
- **Upload Errors**: File validation and size limit messages
- **Submission Errors**: Network and permission error handling

### Graceful Degradation
- **Missing Data**: Fallback values for optional fields
- **Network Issues**: Retry mechanisms and user feedback
- **Permission Errors**: Clear explanations and next steps

## Navigation

### Sidebar Integration
- **Dynamic Loading**: Fetches applicant-specific sidebar items
- **Consistent Navigation**: Same sidebar as other applicant pages
- **Context Awareness**: Maintains user role and permissions

### Back Navigation
- **Dashboard Return**: Back button returns to applicant dashboard
- **Cancel Option**: Cancel button during form submission
- **Automatic Redirect**: After successful submission

## Styling

### CSS Classes
- **`.PostGrantReport`**: Main container styling
- **`.PostGrantReport-header-container`**: Header with back button
- **`.application-info-section`**: Application details display
- **`.deadline-notice`**: Deadline information with overdue styling
- **`.PostGrantReport-section-box`**: Main form container
- **`.report-upload`**: File upload area styling
- **`.attestation`**: Form field styling
- **`.pdf-viewer`**: PDF link styling
- **`.submission-confirmation`**: Read-only submission details

### Responsive Design
- **Mobile Friendly**: Adapts to smaller screen sizes
- **Flexible Layout**: Grid-based submission details
- **Touch Optimized**: Large buttons and touch-friendly inputs

## Integration Points

### Backend Services
- **`writePostGrantReport`**: Handles report submission
- **`getCurrentCycle`**: Fetches application cycle data
- **`getUsersCurrentCycleAppplications`**: Gets user's applications
- **`getDecisionData`**: Verifies application acceptance
- **`checkIfReportSubmitted`**: Checks submission status
- **`getReportsByUser`**: Fetches user's submitted reports
- **`getPDFDownloadURL`**: Converts file ID to download URL

### TypeScript Interfaces
- **`Application`**: Application data structure
- **`ApplicationCycle`**: Cycle information with deadlines
- **`PostGrantReport`**: Report data structure
- **`SideBarTypes`**: Sidebar navigation items

## Security Considerations

### Authentication
- **Route Protection**: Wrapped in `ApplicantProtectedRoute`
- **User Verification**: Ensures current user owns the application
- **Permission Checks**: Validates user can submit reports

### Data Validation
- **File Type**: PDF format validation
- **File Size**: 50MB maximum size limit
- **Form Data**: Required field validation
- **Application Status**: Only accepted applications allowed

### Error Boundaries
- **Graceful Failures**: Handles missing data gracefully
- **User Feedback**: Clear error messages
- **Fallback States**: Default values for missing information

## Recent Updates

### v2.0 - Full-Screen Implementation
- Replaced modal with full-screen page
- Added sidebar navigation
- Implemented PDF URL fetching
- Added submission confirmation view
- Enhanced error handling and loading states

### v1.5 - Dashboard Integration
- Integrated with applicant dashboard
- Added deadline information display
- Implemented visual status indicators

### v1.0 - Initial Implementation
- Basic form functionality
- Modal-based interface
- Simple file upload
- Basic validation
