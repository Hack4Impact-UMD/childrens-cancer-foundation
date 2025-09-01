# Page: Admin Dashboard

This document outlines the Firebase interactions for the `AdminDashboardViewAll.tsx` page.

## Overview

The Admin Dashboard provides administrators with a comprehensive view of all user accounts in the system. It allows for searching, filtering, and contacting users.

## Firebase Service Usage

### Firestore

-   **`applicants` collection:**
    -   **Purpose:** To retrieve a complete list of all applicant users.
    -   **Details:** The page fetches all documents from the `applicants` collection upon loading.

-   **`reviewers` collection:**
    -   **Purpose:** To retrieve a complete list of all reviewer users.
    -   **Details:** The page fetches all documents from the `reviewers` collection upon loading.

## Data Flow Summary

1.  The admin navigates to the dashboard page.
2.  The page simultaneously fetches all documents from both the `applicants` and `reviewers` collections in Firestore.
3.  The data from these two collections is merged into a single list of user accounts.
4.  This unified list is displayed in a table, allowing the admin to view, search, and filter all users in the system.
5.  The admin can select users from the table to send them an email.
