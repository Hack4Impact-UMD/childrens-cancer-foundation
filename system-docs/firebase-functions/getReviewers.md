# getReviewers

## Purpose

This function retrieves a list of all users with the "reviewer" role.

## Trigger

This is an HTTP-triggered function, triggered by `onRequest`.

## Logic

1.  Initializes an empty array `reviewerUserIds`.
2.  Recursively lists all users in batches of 1000.
3.  For each user, it checks if they have a custom claim `role` equal to `"reviewer"`.
4.  If the user is a reviewer, their UID is added to the `reviewerUserIds` array.
5.  Returns a JSON object with the list of reviewer UIDs.
