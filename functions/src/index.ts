/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const addReviewerRole = functions.https.onCall((data: any,
  context: any) => {
  return admin.auth().getUserByEmail(data.email).then((user: any) => {
    return admin.auth().setCustomUserClaims(user.uid, {
      role: "reviewer",
    });
  }
  ).then(() => {
    return {
      message: `Success! ${data.email} has been made a reviewer.`,
    };
  }).catch((err: any) => {
    return err;
  });
});

export const addApplicantRole = functions.https.onCall((data: any,
  context: any) => {
  return admin.auth().getUserByEmail(data.email).then((user: any) => {
    return admin.auth().setCustomUserClaims(user.uid, {
      role: "applicant",
    });
  }
  ).then(() => {
    return {
      message: `Success! ${data.email} has been made an applicant.`,
    };
  }).catch((err: any) => {
    return err;
  });
});

export const addAdminRole = functions.https.onCall((data: any,
  context: any) => {
  return admin.auth().getUserByEmail(data.email).then((user: any) => {
    return admin.auth().setCustomUserClaims(user.uid, {
      role: "admin",
    });
  }
  ).then(() => ({
    message: `Success! ${data.email} has been made an admin.`,
  })).catch((err: any) => {
    return err;
  });
});
