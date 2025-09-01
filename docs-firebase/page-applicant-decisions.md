# Page: Applicant Decisions

This document outlines the Firebase interactions for the `ApplicantDecisions.tsx` page.

## Overview

This page is designed for applicants to view the final funding decisions for their submitted applications. Access to this page is restricted based on the current stage of the application cycle.

## Firebase Service Usage

### Firestore

-   **`applicationCycles` collection:**
    -   **Purpose:** To control access to the decisions.
    -   **Function:** `getCurrentCycle()`
    -   **Details:** On page load, this function is called to check if the `stage` of the current application cycle is "Final Decisions". If it is not, the user is shown a message and cannot view any decisions.

-   **`applications` collection:**
    -   **Purpose:** To retrieve the list of applications submitted by the current user.
    -   **Function:** `getUsersCurrentCycleAppplications()`
    -   **Details:** This function fetches all application documents from the current cycle where the `creatorId` matches the logged-in user's ID.

-   **`decisions` collection:**
    -   **Purpose:** To retrieve the final decision for each of the user's applications.
    -   **Function:** `getDecisionData()`
    -   **Details:** After fetching the user's applications, this function is called for each application to get the corresponding document from the `decisions` collection. This document contains the final outcome (accepted/rejected) and any comments.

### Firebase Authentication

-   **Purpose:** To identify the current user.
-   **Details:** The `getUsersCurrentCycleAppplications` service function uses the `auth.currentUser` object to get the user's ID for querying the `applications` collection.

## Data Flow Summary

1.  **Stage Verification:** The page loads and first checks the `applicationCycles` collection to ensure the current stage is "Final Decisions".

2.  **Data Fetching:**
    a.  If the stage is correct, the page fetches all of the current user's applications from the `applications` collection.
    b.  It then iterates through the fetched applications and fetches the corresponding decision for each one from the `decisions` collection.

3.  **Display:** The page displays a list of the user's applications. When one is selected, the details from the corresponding decision document are shown. If a decision is not yet available for a specific application, a "Pending" status is displayed.

This page is read-only and does not write any data back to Firebase.

---

## Related Page: `ResultsPage.tsx`

The `ApplicantDecisions.tsx` page links to the `ResultsPage.tsx` page, which displays the detailed feedback from reviewers.

### Firebase Service Usage (`ResultsPage.tsx`)

-   **`reviews` collection:**
    -   **Purpose:** To display detailed feedback to the applicant.
    -   **Function:** `getReviewsForApplication()`
    -   **Details:** This function is called with the application ID to fetch the detailed feedback from both the primary and secondary reviewers.
