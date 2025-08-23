# AdminEditInformation

This page allows administrators to manage application cycle settings, deadlines, and FAQ content.

## Logic

- **Cycle Management**: Admins can view and modify the current application cycle
- **Deadline Setting**: Set deadlines for different stages of the application process
- **Stage Control**: Change the current stage of the application cycle
- **FAQ Management**: Update frequently asked questions
- **Post-Grant Report Deadlines**: Set deadlines for post-grant report submissions

## Features

### Deadline Management

#### Application Deadlines
- Set universal deadline for all application types
- Updates research, NextGen, and non-research application deadlines
- Deadline is set to 11:59 PM on the selected date

#### Reviewer Deadlines
- Set deadline for reviewer responses
- Controls when reviewers must complete their reviews
- Deadline is set to 11:59 PM on the selected date

#### Post-Grant Report Deadlines
- Set deadline for post-grant report submissions
- Applies to applicants with accepted grant applications
- Deadline is set to 11:59 PM on the selected date
- New feature for managing post-grant report requirements

### Stage Management
- **Available Stages**:
  - Applications Open
  - Applications Closed
  - Review
  - Grading
  - Final Decisions
- **Stage Transitions**: Admins can progress through stages as the cycle advances
- **Visual Feedback**: Current stage is highlighted and saved with loading indicators

### Cycle Management
- **End Current Cycle**: Allows starting a new application cycle
- **New Cycle Creation**: Prompts for cycle name and sets default deadlines
- **Automatic Setup**: New cycles are automatically configured with reasonable defaults

### FAQ Management
- **Editable FAQs**: Admins can add, edit, and remove frequently asked questions
- **Real-time Updates**: Changes are immediately reflected in the application
- **User-friendly Interface**: Simple form for managing FAQ content
- **Sample FAQ Initialization**: Button to populate database with sample FAQ data
- **Markdown Support**: FAQ answers support rich text formatting

## Data Flow

1. **Initialization**:
   - Loads current cycle data
   - Fetches FAQ content
   - Sets up date pickers with current values

2. **Deadline Updates**:
   - Admin selects new date
   - Clicks update button
   - System saves to Firebase
   - Success message is displayed

3. **Stage Changes**:
   - Admin selects new stage
   - System updates Firebase
   - UI reflects change immediately
   - Loading indicators show progress

4. **Cycle Management**:
   - Admin ends current cycle
   - System creates new cycle
   - Page reloads with new cycle data

## Related Components

- **Application Cycle Backend**: Handles cycle data management
- **FAQ Handler**: Manages FAQ content with sample data initialization
- **Date Pickers**: Material-UI components for date selection
- **Sidebar**: Provides navigation to other admin functions
- **EditableFAQComponent**: Component for editing FAQ content

## Recent Updates

### FAQ Integration Enhancement
- Added "Initialize Sample FAQs" button for easy database population
- Enhanced FAQ data fetching and error handling
- Improved user experience with sample content
- Added debugging capabilities for troubleshooting
