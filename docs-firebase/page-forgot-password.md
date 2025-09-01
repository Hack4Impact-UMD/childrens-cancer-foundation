# Page: Forgot Password

This document outlines the Firebase interactions for the `ForgotPassword.tsx` page.

## Overview

This page provides the user interface for users to reset their forgotten passwords. Users can access this page by clicking the "Forgot password" link on the login page.

## Firebase Service Usage

### Firebase Authentication

-   **Purpose:** To send password reset emails to users.
-   **Function:** `resetPassword()` (which wraps Firebase's `sendPasswordResetEmail` method).
-   **Details:** When a user submits their email address, this function is called to send a password reset email via Firebase Authentication. Firebase handles the email delivery and provides a secure link for the user to reset their password.

## Data Flow Summary

1.  The user navigates to the forgot password page from the login page.
2.  The user enters their email address into the form.
3.  Upon submission, the `resetPassword` service function is called.
4.  This function passes the email to Firebase's `sendPasswordResetEmail` method.
5.  Firebase Authentication sends a password reset email to the provided address.
6.  If successful, a success message is displayed to the user. If it fails (e.g., invalid email or user not found), an appropriate error message is shown.
7.  The user receives an email with a secure link to reset their password.
8.  Clicking the link in the email takes the user to the application's email action handler page (`/email-action-handler`) where they can set a new password securely within the application.

## Features

- **Email Validation:** The form validates email format before submission
- **Loading State:** Shows "Sending..." while the email is being sent
- **Error Handling:** Displays appropriate error messages for various scenarios
- **Success Feedback:** Confirms when the reset email has been sent successfully
- **Responsive Design:** Matches the login page design and works on all screen sizes
- **Navigation:** Provides a "Back to Login" link for easy navigation

## Error Handling

The page handles the following error scenarios:
- Invalid email format
- Email address not found in the system
- Network or Firebase service errors
- General unexpected errors

## Related Pages

- **Email Action Handler** (`/email-action-handler`): Handles the password reset completion when users click the link in their email. This page verifies the reset code and allows users to set a new password.
