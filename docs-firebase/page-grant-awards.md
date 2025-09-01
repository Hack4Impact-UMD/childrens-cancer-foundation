# Page: Grant Awards

This document outlines the Firebase interactions for the `GrantAwards.tsx` page.

## Overview

This is a powerful, admin-only page for making the final funding decisions on grant applications. It provides a data table of all applications, their final review scores, and allows administrators to set recommended funding amounts, make final acceptance or rejection decisions, and add comments for applicants.

## Firebase Service Usage

### Firestore

-   **`applications` collection:**
    -   **Purpose:** To read application data and to write back the final decision status.
    -   **Interactions:**
        -   **Read:** Fetches all documents from this collection on page load to build the main data table.
        -   **Write:** When a decision is saved, this collection is updated with the final `decision` status (e.g., "accepted", "pending").

-   **`decisions` collection:**
    -   **Purpose:** This is the primary collection for storing the final decision data, including funding amounts and comments.
    -   **Interactions:**
        -   **Read (`getMultipleDecisionData`):** Fetches all existing decision documents to populate the table with previously saved funding amounts and comments.
        -   **Write (`updateFundingDecision`):** When an admin saves a decision, this function is called to create or update the decision document with the recommended funding amount and the final acceptance status.
        -   **Write (`updateDecisionComments`):** When an admin saves comments for an applicant, this function updates the `comments` field in the corresponding decision document.

-   **`reviews` collection:**
    -   **Purpose:** To ensure the final scores are accurate.
    -   **Function:** `checkAndUpdateApplicationStatus()`
    -   **Details:** This service function is used to refresh the final scores. It likely reads the individual review scores from this collection, calculates the average, and saves it to the corresponding `applications` document.

-   **`applicationCycles` collection:**
    -   **Purpose:** To populate the cycle filter dropdown.
    -   **Function:** `getAllCycles()`
    -   **Details:** Fetches all documents from this collection.

## Data Flow Summary

1.  **Initial Load:** The page fetches all data from the `applications`, `decisions`, and `applicationCycles` collections to build a comprehensive table of all applications.

2.  **Score Refresh (Optional):** An admin can trigger a score refresh, which calls a service function to recalculate the average scores from the `reviews` collection and update the `applications` collection.

3.  **Decision Making:** The admin modifies the recommended funding amount, acceptance status, and comments for applications directly in the table. These changes are held in the component's local state.

4.  **Saving Decisions:** When the admin saves the changes for an application, the following writes occur:
    a.  The `decisions` collection is updated with the funding amount and acceptance status.
    b.  The `applications` collection is updated with the final decision string.
    c.  Comments are saved separately to the `decisions` collection.
