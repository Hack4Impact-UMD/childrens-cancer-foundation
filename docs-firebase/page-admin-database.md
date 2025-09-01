# Page: Admin Database

This document outlines the Firebase interactions for the `AdminDatabase.tsx` page.

## Overview

This page serves as a comprehensive database for administrators to view, search, and filter all grant applications that have been submitted to the system. It is a read-only view of the `applications` collection.

## Firebase Service Usage

### Firestore

-   **`applications` collection:**
    -   **Purpose:** To retrieve all application data for display and filtering.
    -   **Function:** `getFilteredApplications({})`
    -   **Details:** On page load, this function is called with an empty filter object, which signifies that all documents from the `applications` collection should be fetched.

## Data Flow Summary

1.  **Initial Load:** The admin navigates to the page, which triggers a single, comprehensive fetch of all documents from the `applications` collection in Firestore.

2.  **Local Processing:** The fetched data is then processed and displayed on the client-side.
    -   Applications are grouped by their `applicationCycle` (year).
    -   The component provides UI elements for searching and filtering the applications based on various criteria (year, decision, grant type, institution).

3.  **Display:** The filtered data is rendered in a collapsible, nested list format for easy navigation.

This page does not write any data back to Firebase; it is purely for data visualization and exploration.
