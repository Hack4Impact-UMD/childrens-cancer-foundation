# Page: Admin Edit Information

This document outlines the Firebase interactions for the `AdminEditInformation.tsx` page.

## Overview

This page is a central control panel for administrators to manage core aspects of the application, specifically the application cycle and the Frequently Asked Questions (FAQs).

---

## Application Cycle Management

### Firebase Service Usage

-   **Firestore (`applicationCycles` collection):**
    -   **Purpose:** To control the timing and stage of the entire grant application process.
    -   **Interactions:**
        -   **Read (`getCurrentCycle`):** Fetches the current application cycle document to display the current deadlines and stage.
        -   **Write (`updateCurrentCycleDeadlines`):** Updates the various deadline fields (for applications, reviews, etc.) in the current cycle document.
        -   **Write (`updateCycleStage`):** Updates the `stage` field of the current cycle document to move the application process forward (e.g., from 'Applications Open' to 'Review').
        -   **Write (`endCurrentCycleAndStartNewOne`):** A more complex operation that likely sets the `current` field of the current cycle to `false` and creates a new cycle document, marking it as the new current one.

### Data Flow Summary

1.  The page loads and fetches the current application cycle data from Firestore.
2.  Admins can modify deadlines and the current stage.
3.  Saving these changes triggers specific functions that update the corresponding fields in the current application cycle document in Firestore.
4.  Admins can also initiate a new application cycle, which involves both updating the old cycle and creating a new one.

---

## FAQ Management

### Firebase Service Usage

-   **Firestore (`faq` collection):**
    -   **Purpose:** To manage the content of the FAQ section displayed to users.
    -   **Interactions:**
        -   **Read (`getFAQs`):** Fetches all documents from the collection to display in an editable list.
        -   **Create (`createNewFAQ`):** Adds a new document to the collection when an admin creates a new FAQ.
        -   **Create (`initializeSampleFAQs`):** A utility function to populate the collection with a predefined set of sample FAQs.
        -   **Update/Delete:** The `EditableFAQComponent` used on this page contains the logic to update or delete individual FAQ documents in the collection.

### Data Flow Summary

1.  The page loads and fetches all existing FAQs from Firestore.
2.  Admins can create, update, or delete FAQs.
3.  These actions directly correspond to create, update, and delete operations on documents within the `faq` collection in Firestore.
