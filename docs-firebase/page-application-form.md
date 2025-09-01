# Page: Application Form

This document outlines the Firebase interactions for the application form pages, including `ApplicationForm.tsx` (for Research and NextGen grants) and `NRApplicationForm.tsx` (for Non-Research grants).

## Overview

The application forms are multi-step forms that allow applicants to submit their grant proposals. The forms collect all the necessary information and a PDF upload, then submit the data to a Firebase Cloud Function for processing.

## Firebase Service Usage

### Firebase Cloud Functions

-   **`uploadResearchApplication`**
    -   **Triggered by:** `ApplicationForm.tsx`
    -   **Purpose:** To handle the submission of Research and NextGen grant applications.
    -   **Process:**
        1.  Receives application data and the uploaded file from the frontend.
        2.  Performs validation on the server-side.
        3.  Checks the `applicationCycles` collection in Firestore to ensure the submission is within the allowed timeframe.
        4.  Checks if the user has already submitted an application of the same type.
        5.  Uploads the application PDF to a designated bucket in Firebase Storage.
        6.  Creates a new document in the `applications` collection in Firestore with the application data and a reference to the stored file.

-   **`uploadNonResearchApplication`**
    -   **Triggered by:** `NRApplicationForm.tsx`
    -   **Purpose:** To handle the submission of Non-Research grant applications.
    -   **Process:** The process is identical to `uploadResearchApplication`, but for non-research grants.

### Firestore

-   **`applicationCycles` collection:**
    -   **Purpose:** To control the application submission period.
    -   **Function:** `getCurrentCycle()`
    -   **Details:** Both application forms fetch the current application cycle to check if the `stage` is "Applications Open". If not, the submission button is disabled.

-   **`applications` collection:**
    -   **Purpose:** To store the submitted application data.
    -   **Details:** The cloud functions (`uploadResearchApplication` and `uploadNonResearchApplication`) create new documents in this collection.

### Firebase Storage

-   **Purpose:** To store the PDF files uploaded by applicants.
-   **Details:** The cloud functions upload the files to Firebase Storage and link them to the corresponding application document in Firestore.

## Data Flow Summary

1.  The user navigates to the application form.
2.  The form component fetches the current application cycle from Firestore to determine if submissions are open.
3.  The user fills out the form and uploads a PDF.
4.  Upon submission, the form calls the appropriate Firebase Cloud Function (`uploadResearchApplication` or `uploadNonResearchApplication`) with the form data and the file.
5.  The Cloud Function validates the data, uploads the file to Firebase Storage, and creates a new application record in the `applications` collection in Firestore.
6.  The user is then redirected to their dashboard.
