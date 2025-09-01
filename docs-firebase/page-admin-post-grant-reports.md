# Page: Admin Post-Grant Reports

This document outlines the Firebase interactions for the `AdminPostGrantReports.tsx` page.

## Overview

This page provides administrators with a centralized view to track the status of all post-grant reports for accepted applications. It allows them to see which reports have been submitted, which are pending, and which are overdue.

## Firebase Service Usage

### Firestore

-   **`applications` collection:**
    -   **Purpose:** To get a list of all applications that might require a post-grant report.
    -   **Details:** Fetches all documents from this collection on page load.

-   **`post-grant-reports` collection:**
    -   **Purpose:** To get a list of all submitted post-grant reports.
    -   **Function:** `getAllPostGrantReports()`
    -   **Details:** Fetches all documents from this collection on page load.

-   **`decisions` collection:**
    -   **Purpose:** To filter the applications and only show those that were accepted.
    -   **Function:** `getMultipleDecisionData()`
    -   **Details:** This service function is used to fetch the decisions for all applications, which are then used to identify the accepted ones.

### Firebase Storage

-   **Purpose:** To provide access to the submitted report PDFs.
-   **Function:** `getDownloadURL()`
-   **Details:** For each submitted report, this function is used to generate a URL to the corresponding PDF file in Firebase Storage, allowing the admin to view or download it.

## Data Flow Summary

1.  **Initial Load:** The page loads and fetches all data from three collections: `applications`, `post-grant-reports`, and `decisions`.

2.  **Data Aggregation:** The component then aggregates this data on the client-side:
    a.  It identifies all accepted applications using the data from the `decisions` collection.
    b.  It creates a map of the submitted reports for easy lookup.
    c.  It iterates through the accepted applications, checks for a corresponding report, and determines the report's status (submitted, pending, overdue).

3.  **Display:** The resulting list of applications and their report statuses is displayed in a filterable, searchable table. Admins can click a button to view the PDF of any submitted report.

This page is read-only and does not write any data back to Firebase.
