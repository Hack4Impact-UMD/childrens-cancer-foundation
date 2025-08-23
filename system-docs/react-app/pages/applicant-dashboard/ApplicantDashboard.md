# Applicant Dashboard

## Overview
The Applicant Dashboard (`ApplicantDashboard.tsx`) is the main interface for applicants to view their applications, submit post-grant reports, and access other applicant-specific features. It provides a comprehensive overview of the applicant's grant application status and post-grant reporting requirements.

## Location
- **Route**: `/applicant/dashboard`
- **File**: `src/pages/applicant-dashboard/ApplicantDashboard.tsx`
- **Protected**: Applicant authentication required

## Features

### Application Management
- **Current Applications**: Shows all applications for the current cycle
- **Application Status**: Displays decision status for each application
- **Application Details**: Click to view full application information
- **Application Types**: Supports Research, NextGen, and Non-Research grants

### Post-Grant Reports Integration
- **Reports Required**: Shows accepted applications needing post-grant reports
- **Submitted Reports**: Displays completed reports with submission details
- **Visual Status Indicators**: Green "Report Already Submitted ✓" buttons for completed reports
- **Deadline Information**: Shows submission deadlines with overdue warnings
- **Direct Navigation**: Click "Submit Report" to go to full-screen report page

### Dynamic Content
- **Application Cycle Awareness**: Shows relevant information based on current cycle stage
- **Deadline Reminders**: Displays application deadlines when cycle is open
- **Status-Based Display**: Different content based on application decisions

### FAQ and Contact
- **FAQ Section**: Collapsible frequently asked questions
- **Contact Information**: Applicant support contact details
- **Expandable Sections**: User-controlled content visibility

## Post-Grant Reports Section

### Reports Required
- **Conditional Display**: Only shows when user has accepted applications
- **Application List**: Lists each accepted application needing a report
- **Submit Buttons**: Direct navigation to post-grant report pages
- **Deadline Display**: Shows submission deadline from application cycle
- **Overdue Warnings**: Visual indicators for missed deadlines

### Submitted Reports
- **Completion Status**: Shows which reports have been submitted
- **Submission Details**: Displays comprehensive submission information
- **PDF Viewing**: Direct links to view submitted PDF files
- **Visual Confirmation**: Checkmark icons and "Report Submitted ✓" badges

### Status Indicators
- **Green Buttons**: "Report Already Submitted ✓" for completed reports
- **Blue Buttons**: "Submit Report" for pending reports
- **Disabled State**: Submitted buttons are non-clickable
- **Clear Distinction**: Easy visual identification of report status

## State Management

### Core State Variables
```typescript
const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(getSidebarbyRole('applicant'));
const [completedApplications, setCompletedApplications] = useState<ApplicationWithDecision[]>();
const [inProgressApplications, setInProgressApplications] = useState<Application[]>([]);
const [openModal, setOpenModal] = useState<Application | null>();
const [faqData, setFAQData] = useState<FAQItem[]>([]);
const [appCycle, setAppCycle] = useState<ApplicationCycle>();
const [applicationsOpen, setApplicationsOpen] = useState<boolean>(false);
const [loading, setLoading] = useState<boolean>(true);
```

### Extended Application Type
```typescript
type ApplicationWithDecision = Application & {
    isAccepted?: boolean;
    hasReportSubmitted?: boolean;
    submittedReport?: PostGrantReport;
};
```

## Key Functions

### `initializeData()`
- **Purpose**: Loads all dashboard data on component mount
- **Process**:
  1. Fetches dynamic sidebar items
  2. Loads current application cycle
  3. Gets user's applications
  4. Checks decision status for each application
  5. Verifies post-grant report submission status
  6. Fetches PDF URLs for submitted reports

### `formatDate(dateString: string | Date | undefined | null)`
- **Purpose**: Safely formats dates for display
- **Handles**: String dates, Date objects, Firestore timestamps
- **Fallbacks**: Returns 'N/A' for invalid/missing dates

### Navigation Functions
- **`navigate()`**: React Router navigation to different pages
- **`setOpenModal()`**: Opens application detail modal
- **`closeModal()`**: Closes application detail modal

## Post-Grant Report Integration

### Report Status Checking
```typescript
// Check if application is accepted
const decision = await getDecisionData(app.id);
const hasReportSubmitted = await checkIfReportSubmitted(app.id);

// Get submitted report details
const submittedReport = userReports.find(report => report.applicationId === app.id);

// Fetch PDF URL for viewing
if (submittedReport) {
    const fileId = submittedReport.pdf || submittedReport.file;
    if (fileId) {
        const pdfUrl = await getPDFDownloadURL(fileId);
        submittedReport.file = pdfUrl;
    }
}
```

### Visual Status Display
- **Pending Reports**: Blue "Submit Report" buttons
- **Submitted Reports**: Green "Report Already Submitted ✓" buttons
- **Deadline Information**: Yellow warning boxes with deadline dates
- **Overdue Warnings**: Red indicators for missed deadlines

## UI Components

### Collapsible Sections
- **Applications**: Toggle to show/hide application list
- **FAQ**: Toggle to show/hide frequently asked questions
- **Contact**: Toggle to show/hide contact information

### Application Cards
- **Application Type**: Research, NextGen, or Non-Research
- **Decision Status**: Accepted, Rejected, or Pending
- **Action Buttons**: View details or submit reports

### Post-Grant Report Items
- **Application Title**: Name of the accepted application
- **Status Button**: Submit or Submitted indicator
- **Details Popup**: Comprehensive submission information

## Error Handling

### Loading States
- **Initial Loading**: Shows loading state while fetching data
- **PDF Loading**: Handles PDF URL fetching delays
- **Error Recovery**: Graceful handling of failed requests

### Error States
- **Permission Errors**: Handles Firestore permission issues
- **Network Errors**: Retry mechanisms for failed requests
- **Missing Data**: Fallback values for incomplete information

## Integration Points

### Backend Services
- **`getUsersCurrentCycleAppplications`**: Fetches user's applications
- **`getDecisionData`**: Gets application decision status
- **`checkIfReportSubmitted`**: Verifies report submission
- **`getReportsByUser`**: Fetches user's submitted reports
- **`getPDFDownloadURL`**: Converts file IDs to download URLs
- **`getCurrentCycle`**: Gets current application cycle
- **`getFAQs`**: Fetches FAQ data

### Components
- **`Sidebar`**: Navigation component
- **`CoverPageModal`**: Application detail modal
- **`FAQComponent`**: FAQ display component
- **`ContactUs`**: Contact information component
- **`Banner`**: Status banner component

## Styling

### CSS Classes
- **`.ApplicantDashboard`**: Main container styling
- **`.post-grant-reports-section`**: Post-grant reports area
- **`.submitted-reports-section`**: Submitted reports display
- **`.post-grant-report-item`**: Individual report item
- **`.post-grant-report-btn`**: Report submission buttons
- **`.post-grant-report-btn.submitted`**: Submitted button styling
- **`.deadline-info`**: Deadline information display
- **`.overdue-notice`**: Overdue warning styling

### Responsive Design
- **Mobile Friendly**: Adapts to smaller screen sizes
- **Flexible Layout**: Responsive grid for report items
- **Touch Optimized**: Large buttons and touch-friendly interface

## Recent Updates

### v2.0 - Full Post-Grant Report Integration
- Added comprehensive post-grant reports section
- Implemented visual status indicators
- Added PDF viewing functionality
- Integrated with full-screen report pages
- Added deadline information display

### v1.5 - Enhanced Application Management
- Improved application status display
- Added decision-based filtering
- Enhanced error handling
- Better loading states

### v1.0 - Initial Implementation
- Basic application listing
- Simple status display
- FAQ and contact sections
- Basic navigation
