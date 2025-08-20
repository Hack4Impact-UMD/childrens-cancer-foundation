# addApplicantRole

## Purpose

This function assigns the "applicant" role to a user.

## Trigger

This is a callable function, triggered by `onCall`.

## Input

The function expects the following data in the request:

```json
{
  "email": "user@example.com"
}
```

## Logic

1.  Retrieves the user by their email address.
2.  Sets a custom user claim `role` to `"applicant"`.
3.  Returns a success message or an error.
