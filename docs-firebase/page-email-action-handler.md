# Page: Email Action Handler

This document outlines the Firebase interactions for the `EmailActionHandler.tsx` page.

## Overview

This page handles Firebase Authentication email actions, specifically password reset confirmations. Users are directed to this page when they click the reset link in their password reset email.

## Firebase Service Usage

### Firebase Authentication

-   **Purpose:** To verify and process password reset actions from email links.
-   **Functions:** 
    - `verifyPasswordResetCode()` - Verifies that the reset code from the email is valid and retrieves the associated email address
    - `confirmPasswordReset()` - Completes the password reset with the new password

## URL Parameters

The page expects the following URL parameters (automatically provided by Firebase):
- `mode`: The action mode (e.g., "resetPassword")
- `oobCode`: The out-of-band action code for verification
- `apiKey`: Firebase API key
- `lang`: Language code

## Data Flow Summary

1.  User clicks the password reset link in their email, which contains special Firebase parameters
2.  The application routes to `/email-action-handler` with the Firebase parameters
3.  The page extracts the `mode` and `oobCode` from the URL parameters
4.  If the mode is "resetPassword", the page calls `verifyPasswordResetCode()` to validate the reset code
5.  If valid, the user's email address is retrieved and displayed
6.  The user enters their new password (with confirmation)
7.  Upon form submission, `confirmPasswordReset()` is called with the reset code and new password
8.  If successful, the password is updated and the user is informed they can now log in
9.  If any step fails, appropriate error messages are displayed

## Features

- **Code Verification:** Automatically verifies the reset code from the email link
- **Email Display:** Shows which email account the password is being reset for
- **Password Validation:** Ensures passwords match and meet minimum requirements
- **Loading States:** Shows appropriate loading messages during verification and reset
- **Error Handling:** Comprehensive error handling for various failure scenarios
- **Success Feedback:** Clear confirmation when password reset is successful
- **Responsive Design:** Works on all screen sizes and devices
- **Navigation:** Provides links back to login or to request a new reset

## Error Handling

The page handles the following error scenarios:
- Invalid or expired reset links
- Mismatched password confirmation
- Weak passwords (less than 6 characters)
- Network or Firebase service errors
- Invalid action modes (non-password-reset actions)
- Expired action codes
- General unexpected errors

## Security Features

- **Code Verification:** All reset codes are verified with Firebase before allowing password changes
- **Single Use:** Reset codes can only be used once
- **Time Limits:** Reset codes expire after a certain time period
- **Secure Password Input:** Password fields with show/hide functionality
- **Email Verification:** Displays the email address to confirm the user is resetting the correct account


