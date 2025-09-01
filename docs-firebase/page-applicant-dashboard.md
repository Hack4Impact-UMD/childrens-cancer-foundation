# Page: Applicant Dashboard

This document outlines the Firebase interactions for the Applicant Dashboard page (`/pages/applicant-dashboard/ApplicantDashboard.tsx`).

## Overview

The Applicant Dashboard is the main landing page for users with the "applicant" role. It provides a summary of their applications, post-grant report status, and general information like FAQs. It reads from multiple Firestore collections to assemble the displayed data.

## Firebase Service Usage

### Firestore

-   **`applications` collection:**
    -   **Purpose:** To display a list of the applicant's completed and in-progress applications.
    -   **Function:** `getUsersCurrentCycleAppplications()`
    -   **Details:** Fetches all documents from the `applications` collection where the `creatorId` matches the current user's ID and the `applicationCycle` matches the current cycle.

-   **`decisions` collection:**
    -   **Purpose:** To show the final decision (accepted/rejected) for each completed application.
    -   **Function:** `getDecisionData()`
    -   **Details:** For each application, it fetches the corresponding document from the `decisions` collection using the application ID.

-   **`post-grant-reports` collection:**
    -   **Purpose:** To check the status of post-grant reports for accepted applications.
    -   **Function:** `getReportsByUser()`
    -   **Details:** Fetches reports submitted by the current user to determine if a report has been submitted for an accepted application.

-   **`applicationCycles` collection:**
    -   **Purpose:** To display application deadlines and the current stage of the application cycle.
    -   **Function:** `getCurrentCycle()`
    -   **Details:** Fetches the single document from the `applicationCycles` collection where `current` is true.

-   **`faq` collection:**
    -   **Purpose:** To display a list of frequently asked questions.
    -   **Function:** `getFAQs()`
    -   **Details:** Fetches all documents from the `faq` collection.

### Firebase Storage

-   **Purpose:** To provide a viewable link for submitted post-grant report PDFs.
-   **Function:** `getPDFDownloadURL()`
-   **Details:** If a post-grant report has been submitted, this function is called with the file ID from the report's document to get a downloadable URL for the PDF stored in Firebase Storage.

### Firebase Authentication

-   **Purpose:** To identify the current user.
-   **Details:** Uses `auth.currentUser.uid` to get the user's unique ID, which is then used in Firestore queries to fetch user-specific data (applications, reports).

## Data Flow Summary

1.  The page loads and authenticates the user.
2.  It fetches the current application cycle, all FAQs, and all of the user's applications for the current cycle from Firestore.
3.  For each application, it fetches the associated decision and checks for a submitted post-grant report.
4.  If a report exists, it gets a download URL for the report's PDF from Firebase Storage.
5.  All this data is then displayed to the applicant, providing a complete overview of their status.
