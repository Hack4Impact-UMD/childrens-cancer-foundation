# Page: Post-Grant Report

This document outlines the Firebase interactions for the `PostGrantReportPage.tsx` page.

## Overview

This page allows applicants to submit their required post-grant reports for applications that have been accepted. It also serves as a confirmation and viewing page if a report has already been submitted.

## Firebase Service Usage

### Firestore

-   **`post-grant-reports` collection:**
    -   **Purpose:** To store and retrieve submitted post-grant reports.
    -   **Interactions:**
        -   **Create (`writePostGrantReport`):** When a user submits a report, this function is called to create a new document in the collection. This document contains the report details, a reference to the PDF in Storage, and user information.
        -   **Read (`getReportsByUser`):** On page load, this is used to check if a report has already been submitted for the specific application, preventing duplicate submissions.

-   **`applications` collection:**
    -   **Purpose:** To identify the application for which the report is being submitted.
    -   **Function:** `getUsersCurrentCycleAppplications()`
    -   **Details:** Fetches the user's applications to find the one matching the ID from the URL.

-   **`decisions` collection:**
    -   **Purpose:** To verify that the application was actually accepted before allowing a report submission.
    -   **Function:** `getDecisionData()`
    -   **Details:** Fetches the decision for the application to ensure its status is 'accepted'.

-   **`applicationCycles` collection:**
    -   **Purpose:** To determine the submission deadline.
    -   **Function:** `getCurrentCycle()`
    -   **Details:** Fetches the current cycle to get the `postGrantReportDeadline`.

### Firebase Storage

-   **Purpose:** To store and retrieve the uploaded PDF reports.
-   **Interactions:**
    -   **Upload:** The `writePostGrantReport` service function handles uploading the user's PDF file to a designated location in Firebase Storage.
    -   **Download (`getPDFDownloadURL`):** If a report has already been submitted, this function is used to generate a downloadable URL for the stored PDF, allowing the user to view their submission.

### Firebase Authentication

-   **Purpose:** To identify the current user.
-   **Details:** Uses `auth.currentUser` to get the user's ID for fetching their specific applications and reports.

## Data Flow Summary

1.  **Page Load & Validation:**
    a.  The user navigates to the page with an application ID in the URL.
    b.  The page fetches data from `applications`, `decisions`, `applicationCycles`, and `post-grant-reports` collections.
    c.  It verifies that the application exists, was accepted, and that a report has not already been submitted.

2.  **Display Logic:**
    a.  **If Report Submitted:** The page displays the details of the existing report and provides a link (via `getPDFDownloadURL`) to the PDF in Firebase Storage.
    b.  **If No Report Submitted:** The page displays the report submission form, including the deadline.

3.  **Submission Process:**
    a.  The user fills out the form and selects a PDF to upload.
    b.  On submit, the `writePostGrantReport` function is called.
    c.  This function uploads the PDF to Firebase Storage and creates a new document in the `post-grant-reports` collection in Firestore.
    d.  The user is then shown a confirmation and redirected.
