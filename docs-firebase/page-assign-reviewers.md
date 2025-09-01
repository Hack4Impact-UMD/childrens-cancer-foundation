# Page: Assign Reviewers

This document outlines the Firebase interactions for the `AssignReviewers.tsx` page.

## Overview

This is an administrator-only page used to assign primary and secondary reviewers to grant applications. It provides a comprehensive interface for managing the entire review assignment process.

## Firebase Service Usage

### Firestore

-   **`applications` collection:**
    -   **Purpose:** To display all submitted applications that need reviewers.
    -   **Details:** Fetches all documents from this collection on page load.

-   **`reviewers` collection:**
    -   **Purpose:** To list available reviewers for assignment and to track their assigned applications.
    -   **Details:**
        -   Fetches all documents to populate the reviewer selection modal.
        -   Updates the `assignedApplications` array field of a reviewer's document (using `arrayUnion`) when they are officially assigned to an application.

-   **`reviews` collection:**
    -   **Purpose:** This is the core collection for managing the assignment process. It stores the links between applications and reviewers.
    -   **Functions:**
        -   `getReviewsForApplicationAdmin()`: Fetched for each application to determine its current review status (e.g., not-started, in-progress) and to see which reviewers, if any, are already assigned.
        -   `assignReviewersToApplication()`: This is the key function for creating the assignments. When an admin confirms reviewers for an application, this function creates two new documents in the `reviews` collection, one for the primary and one for the secondary reviewer, linking them to the application.
        -   `findReviewForReviewerAndApplication()`: Used to check if a reviewer has already started their review before allowing an admin to remove them from an assignment.

-   **Other Service Functions:**
    -   `checkAndUpdateApplicationStatus()`: A utility function that can be triggered to recalculate and update an application's overall status based on the progress of its reviews.

## Data Flow Summary

1.  **Initial Load:** The page loads and fetches all documents from the `applications` and `reviewers` collections. It also fetches the review data for each application to determine its status.

2.  **Local Assignment:** The admin selects a primary and secondary reviewer for an application. These selections are temporarily stored in the component's local state.

3.  **Confirmation and Creation:** The admin clicks "Assign Reviewers." This triggers a series of Firestore writes:
    a.  The `assignReviewersToApplication` function is called, creating two new documents in the `reviews` collection.
    b.  The `assignedApplications` field is updated in the documents of the two selected reviewers in the `reviewers` collection.

4.  **Status Management:** The page allows for removing reviewers (with warnings if a review is in progress) and manually refreshing the status of an application's reviews.
