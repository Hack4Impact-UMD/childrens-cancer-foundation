# DefaultRoute

This component redirects the user to their default dashboard based on their role.

## Logic

- It retrieves the user's role.
- Based on the role, it redirects the user to one of the following routes:
  - `/applicant/dashboard`
  - `/reviewer/dashboard`
  - `/admin/dashboard`
- If the user is not logged in, it redirects them to `/login`.
