# Page: Login

This document outlines the Firebase interactions for the `login.tsx` page.

## Overview

This page provides the user interface for registered users to sign in to the application.

## Firebase Service Usage

### Firebase Authentication

-   **Purpose:** To authenticate users and sign them in.
-   **Function:** `loginUser()` (which wraps Firebase's `signInWithEmailAndPassword` method).
-   **Details:** When a user submits their email and password, this function is called to verify the credentials with Firebase Authentication. If the credentials are correct, the user is signed in, and their authentication state is managed by Firebase.

## Data Flow Summary

1.  The user enters their email and password into the login form.
2.  Upon submission, the `loginUser` service function is called.
3.  This function passes the credentials to Firebase's `signInWithEmailAndPassword` method.
4.  Firebase Authentication checks the credentials.
5.  If successful, the user's auth state is updated, and they are redirected to the appropriate dashboard. If it fails, an error is returned and displayed to the user.
