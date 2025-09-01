# Page: Create Account

This document outlines the Firebase interactions for the account creation pages: `CreateAccApplicant.tsx` and `CreateAccReviewer.tsx`.

## Overview

These pages allow new users to register for the application. The process is slightly different for applicants and reviewers, with reviewers requiring their email to be on a whitelist before they can register.

---

## `CreateAccApplicant.tsx` (For Applicants)

### Firebase Service Usage

-   **Firebase Authentication:**
    -   **Purpose:** To create a new user account.
    -   **Function:** `addApplicantUser()` (which wraps Firebase's `createUserWithEmailAndPassword`).

-   **Firestore (`applicants` collection):**
    -   **Purpose:** To store the profile information of the new applicant.
    -   **Details:** After the authentication user is created successfully, the `addApplicantUser` function creates a new document in this collection with the user's details (name, affiliation, etc.).

### Data Flow Summary

1.  The user fills out the registration form.
2.  On submission, the `addApplicantUser` function is called.
3.  This function first creates a new user in Firebase Authentication.
4.  It then creates a corresponding user profile document in the `applicants` collection in Firestore.
5.  The user is redirected to the login page.

---

## `CreateAccReviewer.tsx` (For Reviewers)

This component follows the same pattern as the applicant creation, but with an additional, critical step: a whitelist check.

### Firebase Service Usage

-   **Firestore (`reviewer-whitelist` collection):**
    -   **Purpose:** To verify that the user is authorized to create a reviewer account.
    -   **Details:** Before any other action, the page queries this collection to ensure a document exists with the user's email address. If no matching document is found, the account creation process is halted, and an error is displayed.

-   **Firebase Authentication:**
    -   **Purpose:** To create a new user account (only after the whitelist check passes).
    -   **Function:** `addReviewerUser()` (which wraps `createUserWithEmailAndPassword`).

-   **Firestore (`reviewers` collection):**
    -   **Purpose:** To store the profile information of the new reviewer.
    -   **Details:** After the authentication user is created, the `addReviewerUser` function creates a new document in this collection.

### Data Flow Summary

1.  The user fills out the registration form.
2.  On submission, the page first queries the `reviewer-whitelist` collection in Firestore.
3.  **If the email is not on the whitelist, the process stops.**
4.  If the email is on the whitelist, the `addReviewerUser` function is called.
5.  This function creates the user in Firebase Authentication and the user profile in the `reviewers` collection in Firestore.
6.  The user is redirected to the login page.
