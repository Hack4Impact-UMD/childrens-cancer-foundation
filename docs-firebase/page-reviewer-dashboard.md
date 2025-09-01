# Page: Reviewer Dashboard

This document outlines the Firebase interactions for the `ReviewerDashboard.tsx` page.

## Overview

The Reviewer Dashboard is the central hub for users with the "reviewer" role. It displays a list of applications assigned to them for review, categorized by their status (Not Started, In Progress, Completed).

## Firebase Service Usage

### Firestore

-   **`reviewers` collection:**
    -   **Purpose:** To identify the current reviewer and retrieve their unique ID.
    -   **Details:** The page queries this collection using the email of the currently authenticated user (`auth.currentUser.email`) to find the correct reviewer document.

-   **`reviews` collection:**
    -   **Purpose:** To get the list of all applications assigned to the reviewer.
    -   **Function:** `getReviewsForReviewer()`
    -   **Details:** After getting the reviewer's ID, this function is called to fetch all documents from the `reviews` collection where the `reviewerId` matches.

-   **`applications` collection:**
    -   **Purpose:** To display detailed information about each assigned application.
    -   **Details:** For each review document retrieved, the page performs a separate fetch to the `applications` collection using the `applicationId` from the review document. This is used to display the application's title, principal investigator, etc.

-   **`applicationCycles` collection:**
    -   **Purpose:** To display the deadline for reviews.
    -   **Function:** `getCurrentCycle()`
    -   **Details:** Fetches the current application cycle document to get the `reviewerDeadline`.

### Firebase Authentication

-   **Purpose:** To identify the currently logged-in user.
-   **Details:** Uses `auth.currentUser` to get the user's object, which contains the email needed to query the `reviewers` collection.

## Data Flow Summary

1.  The reviewer navigates to their dashboard.
2.  The page authenticates the user and gets their email.
3.  It fetches the current application cycle from Firestore to find the review deadline.
4.  It uses the user's email to find their unique ID in the `reviewers` collection.
5.  It then fetches all review assignments for that reviewer from the `reviews` collection.
6.  For each review assignment, it fetches the corresponding application details from the `applications` collection.
7.  The applications are then sorted into "Not Started," "In Progress," and "Completed" lists based on the status in the review documents and displayed to the user.
