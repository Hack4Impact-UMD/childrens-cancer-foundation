# Page: Reviewer All Applications

This document outlines the Firebase interactions for the `AllApplications.tsx` page, which is accessible to reviewers.

## Overview

This page allows reviewers to see a list of all applications submitted in the current cycle, not just the ones they have been assigned to review. This provides context and a broader overview of the applicant pool.

## Firebase Service Usage

### Firestore

-   **`applicationCycles` collection:**
    -   **Purpose:** To identify the current application cycle.
    -   **Function:** `getCurrentCycle()`
    -   **Details:** This function is called on page load to get the name of the current cycle.

-   **`applications` collection:**
    -   **Purpose:** To retrieve all applications for the current cycle.
    -   **Function:** `getFilteredApplications()`
    -   **Details:** After getting the current cycle, this function is called with the cycle name to fetch all documents from the `applications` collection that belong to that cycle.

## Data Flow Summary

1.  **Initial Load:** The page loads and first fetches the current application cycle from the `applicationCycles` collection.

2.  **Fetch Applications:** It then uses the current cycle's name to fetch all corresponding applications from the `applications` collection.

3.  **Display:** The fetched applications are displayed in a filterable and searchable list. Reviewers can view the cover page details of any application.

This page is read-only and does not write any data back to Firebase.
