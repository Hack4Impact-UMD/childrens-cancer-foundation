# Page: Settings

This document outlines the Firebase interactions for the user settings pages: `AdminSettings.tsx`, `ApplicantSettings.tsx`, and `ReviewerSettings.tsx`.

## Overview

These pages allow users to manage their account information, including personal details and password. The functionality is tailored to the user's role (Admin, Applicant, or Reviewer).

---

## Common Functionality: Password Update

All three settings pages share the same functionality for updating a user's password.

### Firebase Service Usage

-   **Firebase Authentication:**
    -   **Purpose:** To securely update the user's password.
    -   **Functions:**
        -   `onAuthStateChanged`: To get the currently authenticated user.
        -   `reauthenticateWithCredential`: This is a critical security step. Before a password can be changed, the user must provide their current password to re-verify their identity.
        -   `updatePassword`: If reauthentication is successful, this function is called to update the user's password in Firebase Authentication.

### Data Flow Summary

1.  The user enters their current password and a new password.
2.  The `reauthenticateWithCredential` function is called with the current password.
3.  If successful, the `updatePassword` function is called with the new password.
4.  If either step fails, an appropriate error is displayed.

---

## Role-Specific Functionality: Personal Information

### `ApplicantSettings.tsx`

-   **Firebase Service Usage:**
    -   **Firestore (`applicants` collection):**
        -   **Read (`getCurrentUserData`):** Fetches the applicant's current profile data to populate the form fields.
        -   **Write (`editApplicantUser`):** Updates the applicant's document in the `applicants` collection with any changes to their name, title, or institution.

### `ReviewerSettings.tsx`

-   **Firebase Service Usage:**
    -   **Firestore (`reviewers` collection):**
        -   **Read (`getCurrentUserData`):** Fetches the reviewer's current profile data to populate the form fields.
        -   **Write (`editReviewerUser`):** Updates the reviewer's document in the `reviewers` collection with any changes to their name or title.

### `AdminSettings.tsx`

-   This page **only** includes the password update functionality and does not allow for editing personal information, as admin accounts do not have a separate profile document in Firestore.
