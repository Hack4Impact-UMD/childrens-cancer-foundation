# Sidebar

The sidebar component provides navigation for different user roles in the application.

## Logic

- **Role-based Navigation**: Different sidebar items are shown based on user role (admin, reviewer, applicant)
- **Dynamic Links**: For applicants, the sidebar dynamically shows links based on the current application cycle stage
- **Post-Grant Reports**: Shows "Post-Grant Report" link for applicants with accepted applications

## Sidebar Items by Role

### Admin Sidebar
- Home (Dashboard)
- Account Settings
- All Accounts
- Assign Reviewers
- Assign Awards
- Application Cycle
- Logout

### Reviewer Sidebar
- Home (Dashboard)
- Account Settings
- All Applications
- Logout

### Applicant Sidebar
- Home (Dashboard)
- Account Settings
- Decisions (shown during "Final Decisions" stage)
- Post-Grant Report (shown for users with accepted applications)
- Logout

## Dynamic Functionality

### Decisions Link
- Appears during the "Final Decisions" stage of the application cycle
- Allows applicants to view their application decisions
- Includes visual indicators for new decisions

### Post-Grant Report Link
- Appears for applicants who have accepted grant applications
- Checks all user applications in the current cycle
- Verifies that at least one application has been accepted
- Links to the post-grant report submission page

## Implementation Details

The `getApplicantSidebarItems()` function:
1. Fetches the current application cycle
2. Checks if the cycle is in "Final Decisions" stage
3. Fetches user's applications for the current cycle
4. Checks each application's decision status
5. Dynamically builds the sidebar based on these conditions

## Error Handling

- If there's an error fetching cycle or application data, falls back to the basic applicant sidebar
- Logs errors for debugging purposes
- Ensures the sidebar always provides basic navigation even if dynamic features fail
