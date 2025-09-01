# AdminWhitelistReviewers

This page allows administrators to manage the reviewer whitelist, which controls who can create reviewer accounts.

## Purpose

The reviewer whitelist is a security feature that ensures only pre-approved email addresses can create reviewer accounts. This prevents unauthorized users from gaining reviewer access to the system.

## Features

### View Whitelist Entries
- **Table Display**: Shows all whitelisted emails in a sortable table
- **Search Functionality**: Search by email address or name
- **Institution Filter**: Filter entries by institution/affiliation
- **Entry Count**: Displays total number of whitelisted entries

### Add New Entries
- **Add Button**: Opens a modal form to add new emails
- **Form Fields**: 
  - Email (required)
  - First Name (optional)
  - Last Name (optional)
  - Title (optional)
  - Institution (optional)
- **Validation**: Email format validation and required field checking

### Remove Entries
- **Delete Button**: Remove emails from the whitelist
- **Confirmation**: Confirmation dialog before deletion
- **Immediate Update**: Table refreshes after deletion

## Data Structure

### Whitelist Entry Schema
```typescript
interface WhitelistEntry {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    affiliation?: string;
    title?: string;
    addedAt: Date;
    addedBy: string;
    status: 'active' | 'inactive';
}
```

### Firestore Collection
- **Collection**: `reviewer-whitelist`
- **Document ID**: Auto-generated
- **Fields**: All fields from WhitelistEntry interface

## Integration

### Account Creation Flow
1. User attempts to create reviewer account at `/reviewer/create-account`
2. System checks if email exists in `reviewer-whitelist` collection
3. If whitelisted, account creation proceeds
4. If not whitelisted, error message displayed

### Security Rules
- **Read Access**: All authenticated users can read whitelist
- **Write Access**: Only admins can add/remove entries
- **Collection**: `reviewer-whitelist` in Firestore security rules

## User Interface

### Header
- CCF logo and "Reviewer Whitelist Management" title
- Consistent with other admin pages

### Search and Filters
- Search bar with email/name search
- Institution dropdown filter
- Add Email button

### Table
- Email, Name, Title, Institution, Added Date columns
- Delete action button for each entry
- Hover effects and responsive design

### Add Form Modal
- Overlay modal with form
- Responsive design for mobile devices
- Cancel and Submit buttons

## Error Handling

- **Network Errors**: Graceful handling of Firestore connection issues
- **Validation Errors**: Form validation with user feedback
- **Permission Errors**: Admin-only access enforcement
- **Loading States**: Loading indicators during data operations

## Responsive Design

- **Mobile Friendly**: Responsive layout for smaller screens
- **Table Scrolling**: Horizontal scroll on mobile devices
- **Form Layout**: Stacked form fields on mobile
- **Button Sizing**: Touch-friendly button sizes

## Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Form Labels**: Associated labels for all form inputs
- **Color Contrast**: High contrast for readability

