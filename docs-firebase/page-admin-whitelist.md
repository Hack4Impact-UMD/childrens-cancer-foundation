# Page: Admin Whitelist

This document outlines the Firebase interactions for the `AdminWhitelistReviewers.tsx` page.

## Overview

This is an administrator-only page for managing the reviewer whitelist. Only users whose emails are on this list are permitted to create a reviewer account. This page allows admins to add, view, and remove emails from the whitelist.

## Firebase Service Usage

### Firestore

-   **`reviewer-whitelist` collection:**
    -   **Purpose:** To store the list of emails that are authorized to create reviewer accounts.
    -   **Interactions:**
        -   **Read:** On page load, all documents from this collection are fetched to display the current whitelist.
        -   **Create:** When an admin adds a new email to the whitelist via the form, a new document is created in this collection. The document includes the new user's details and metadata about who added them (`addedBy`).
        -   **Delete:** When an admin removes an email from the whitelist, the corresponding document is deleted from this collection.

### Firebase Authentication

-   **Purpose:** To track which administrator adds an entry to the whitelist.
-   **Details:** Uses `auth.currentUser.email` to get the current admin's email, which is then stored in the `addedBy` field of the new whitelist document.

## Data Flow Summary

1.  **View Whitelist:** The admin navigates to the page, which fetches and displays all entries from the `reviewer-whitelist` collection.

2.  **Add to Whitelist:**
    a.  The admin fills out a form with the new reviewer's email and other details.
    b.  Upon submission, a new document is created in the `reviewer-whitelist` collection.

3.  **Remove from Whitelist:**
    a.  The admin clicks a delete button next to an entry.
    b.  The corresponding document is deleted from the `reviewer-whitelist` collection.
