# AdminDashboardViewAll

This page displays a dashboard for administrators to view all user accounts.

## Logic

- Fetches all applicant and reviewer accounts from Firestore.
- Displays the accounts in a table with search and filter functionality.
- Allows the admin to select accounts and send them an email using a `MailtoLink`.
