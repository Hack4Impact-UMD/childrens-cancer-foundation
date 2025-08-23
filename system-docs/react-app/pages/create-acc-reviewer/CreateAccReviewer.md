# CreateAccReviewer

This page allows administrators to create a new reviewer account.

## Logic

- It provides a form to enter the reviewer's name, email, and other information.
- When the form is submitted, it calls the `addReviewerRole` Firebase Function to create the user and assign them the "reviewer" role.
