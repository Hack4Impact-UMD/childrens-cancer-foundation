# CreateAccApplicant

This page allows administrators to create a new applicant account.

## Logic

- It provides a form to enter the applicant's name, email, and other information.
- When the form is submitted, it calls the `addApplicantRole` Firebase Function to create the user and assign them the "applicant" role.
