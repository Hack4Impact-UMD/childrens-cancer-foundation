# Admin Post-Grant Reports Page

## Overview
The Admin Post-Grant Reports page provides administrators with a comprehensive view of all post-grant reports submitted by applicants. This page allows admins to search, filter, and view post-grant reports with detailed application information.

## Features

### Search and Filtering
- **Search Bar**: Search by Application ID, Application Title, Principal Investigator, Institution, or User Email
- **Status Filter**: Filter by report status (Submitted, Pending, Overdue)
- **Grant Type Filter**: Filter by grant type (Research, NextGen, Non-Research, etc.)

### Data Display
- **Comprehensive Table**: Shows all post-grant reports with application details
- **Status Indicators**: Color-coded status badges for quick visual identification
- **PDF Actions**: View and download PDF reports directly from the table
- **Summary Statistics**: Overview of total reports and status breakdown

### Table Columns
1. **Application ID**: Unique identifier for the application
2. **Application Title**: Title of the grant application
3. **Principal Investigator**: Name of the principal investigator
4. **Institution**: Institution where the research is conducted
5. **Grant Type**: Type of grant (Research, NextGen, Non-Research)
6. **Status**: Current status of the report (Submitted, Pending, Overdue)
7. **Submitted Date**: Date when the report was submitted
8. **Deadline**: Original deadline for the report
9. **Actions**: View and download PDF buttons

## Technical Implementation

### Component Structure
- **AdminPostGrantReports.tsx**: Main component file
- **AdminPostGrantReports.css**: Styling and responsive design
- **Backend Integration**: Uses `getAllPostGrantReports()` function

### Data Flow
1. **Initial Load**: Fetches all post-grant reports from Firestore
2. **Application Data**: Enriches reports with application details
3. **Filtering**: Client-side filtering based on search terms and filters
4. **PDF Handling**: Direct PDF viewing and download via Firebase Storage

### Key Functions
- `fetchAllReports()`: Loads all reports and application data
- `handleViewPDF()`: Opens PDF in new tab
- `getStatusColor()`: Returns appropriate color for status badges
- `formatDate()`: Formats Firestore timestamps for display

## Access Control
- **Admin Only**: Protected by `AdminProtectedRoute`
- **Route**: `/admin/post-grant-reports`
- **Sidebar**: Added to admin sidebar navigation

## Responsive Design
- **Desktop**: Full table view with all columns
- **Tablet**: Responsive table with horizontal scroll
- **Mobile**: Stacked layout with optimized spacing

## Error Handling
- **Loading States**: Shows loading indicator during data fetch
- **Empty States**: Displays appropriate messages when no data
- **PDF Errors**: Handles PDF viewing/download errors gracefully
- **Network Errors**: Graceful degradation for connection issues

## Future Enhancements
- **Export Functionality**: Export reports to CSV/Excel
- **Bulk Actions**: Select multiple reports for batch operations
- **Advanced Filters**: Date range filters, institution filters
- **Report Analytics**: Charts and graphs for report statistics
- **Email Notifications**: Send reminders for overdue reports
