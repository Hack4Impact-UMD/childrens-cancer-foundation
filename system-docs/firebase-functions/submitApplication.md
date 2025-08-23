# submitApplication

## Purpose

This function handles the submission of a grant application.

## Trigger

This is a callable function, triggered by `onCall`.

## Input

The function expects a complex data object with the application details, including `application`, `grantType`, `fileData`, `fileName`, and `fileType`.

## Logic

1.  **Authentication Check:** Ensures the user is authenticated.
2.  **Role Validation:** Verifies that the user has the "applicant" role.
3.  **Data Validation:** Checks for the presence of required data fields.
4.  **File Validation:** Validates the file type (must be PDF) and size (under 50MB).
5.  **Application Cycle Check:** Ensures there is an active application cycle and that the submission is within the deadline for the given grant type.
6.  **Data Validation (Grant Specific):** Validates the application data based on the `grantType`.
7.  **File Upload:** Uploads the application PDF to Firebase Storage.
8.  **Document Creation:** Creates a new application document in the "applications" collection in Firestore.
9.  **Logging:** Logs the successful submission.
10. **Response:** Returns a success message with the new application ID.
