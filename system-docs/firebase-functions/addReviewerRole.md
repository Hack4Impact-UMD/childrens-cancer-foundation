# addReviewerRole

## Purpose

This function assigns the "reviewer" role to a user.

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

1.  Retrieve the user by their email address.
2.  Set a custom user claim `role` to `"reviewer"`.
3.  Return a success message or an error.
