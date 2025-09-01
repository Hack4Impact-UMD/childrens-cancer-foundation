# Page: Application Review

This document outlines the Firebase interactions for the application review pages, including `ApplicationReview.tsx` (for reviewers) and `ApplicationReviewReadOnly.tsx` (for admins).

## Overview

These pages are used to review and grade submitted applications. Reviewers use `ApplicationReview.tsx` to submit their feedback and scores, while admins use `ApplicationReviewReadOnly.tsx` to view the completed reviews.

---

## `ApplicationReview.tsx` (For Reviewers)

### Firebase Service Usage

#### Firestore

-   **`applications` collection:**
    -   **Purpose:** To display the details of the application being reviewed.
    -   **Details:** Fetches a single document from this collection based on the application ID in the URL.

-   **`reviewers` collection:**
    -   **Purpose:** To identify the current reviewer.
    -   **Details:** Queries the collection to find the reviewer document corresponding to the currently authenticated user's email.

-   **`reviews` collection:**
    -   **Purpose:** To store and update the reviewer's feedback and score.
    -   **Functions:**
        -   `findReviewForReviewerAndApplication()`: Finds the specific review document assigned to the current reviewer for the given application.
        -   `updateReview()`: Saves the reviewer's progress to the review document. This is triggered when the reviewer saves their work.
        -   `submitReview()`: Updates the review document with the final score and feedback, and marks it as complete.

### Data Flow Summary

1.  The reviewer navigates to the review page for a specific application.
2.  The page fetches the application data, the reviewer's profile, and the assigned review document from Firestore.
3.  The reviewer fills out the feedback form and provides a score.
4.  They can save their progress, which updates the review document in Firestore.
5.  When they submit the review, the review document is updated one last time, and the status is marked as complete.

---

## `ApplicationReviewReadOnly.tsx` (For Admins)

### Firebase Service Usage

#### Firestore

-   **`applications` collection:**
    -   **Purpose:** To display the details of the application being reviewed.
    -   **Details:** Fetches a single document from this collection based on the application ID in the URL.

-   **`reviews` collection:**
    -   **Purpose:** To display all reviews for a given application.
    -   **Function:** `getReviewsForApplicationAdmin()`
    -   **Details:** Fetches all documents from this collection that are associated with the application ID.

-   **`reviewers` collection:**
    -   **Purpose:** To display the names of the reviewers.
    -   **Details:** Fetches the reviewer documents based on the `reviewerId` stored in each review document.

### Data Flow Summary

1.  An admin navigates to the read-only review page for a specific application.
2.  The page fetches the application data, all associated review documents, and the profiles of the assigned reviewers from Firestore.
3.  The admin can then view the feedback and scores from all reviewers for that application.
4.  No data is written or updated by this component.
