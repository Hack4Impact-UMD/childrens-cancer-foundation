"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import { onCall, onRequest } from "firebase-functions/v2/https";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const { onRequest, onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

// HTTP function using V2 onRequest trigger
exports.helloWorld = onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

// Callable function using V2 onCall trigger for adding the reviewer role
exports.addReviewerRole = onCall((data, context) => {
  return admin.auth().getUserByEmail(data.email)
    .then((user) => {
      return admin.auth().setCustomUserClaims(user.uid, { role: "reviewer" });
    })
    .then(() => {
      return { message: `Success! ${data.email} has been made a reviewer.` };
    })
    .catch((err) => {
      return err;
    });
});

// Callable function using V2 onCall trigger for adding the applicant role
exports.addApplicantRole = onCall((data, context) => {
  return admin.auth().getUserByEmail(data.email)
    .then((user) => {
      return admin.auth().setCustomUserClaims(user.uid, { role: "applicant" });
    })
    .then(() => {
      return { message: `Success! ${data.email} has been made an applicant.` };
    })
    .catch((err) => {
      return err;
    });
});

// Callable function using V2 onCall trigger for adding the admin role
exports.addAdminRole = onCall((data, context) => {
  return admin.auth().getUserByEmail(data.email)
    .then((user) => {
      return admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
    })
    .then(() => {
      return { message: `Success! ${data.email} has been made an admin.` };
    })
    .catch((err) => {
      return err;
    });
});
