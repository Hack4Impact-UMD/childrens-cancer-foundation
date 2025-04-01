/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

exports.helloWorld = functions.https.onRequest(
  (request: any, response: any) => {
    response.send("Hello from Firebase!");
  }
);

export const addReviewerRole = functions.https.onCall(
  (data: any, context: any) => {
    return admin
      .auth()
      .getUserByEmail(data.email)
      .then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
          role: "reviewer",
        });
      })
      .then(() => {
        return {
          message: `Success! ${data.email} has been made a reviewer.`,
        };
      })
      .catch((err: any) => {
        return err;
      });
  }
);

export const addApplicantRole = functions.https.onCall(
  (data: any, context: any) => {
    return admin
      .auth()
      .getUserByEmail(data.email)
      .then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
          role: "applicant",
        });
      })
      .then(() => {
        return {
          message: `Success! ${data.email} has been made an applicant.`,
        };
      })
      .catch((err: any) => {
        return err;
      });
  }
);

export const addAdminRole = functions.https.onCall(
  (data: any, context: any) => {
    return admin
      .auth()
      .getUserByEmail(data.email)
      .then((user: any) => {
        return admin.auth().setCustomUserClaims(user.uid, {
          role: "admin",
        });
      })
      .then(() => {
        return {
          message: `Success! ${data.email} has been made an admin.`,
        };
      })
      .catch((err: any) => {
        return err;
      });
  }
);

export const getUserApplications = functions.https.onRequest(
  async (req: any, res: any) => {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      res.status(400).send("Missing userId parameter");
      return;
    }

    try {
      const snapshot = await admin
        .firestore()
        .collection("applications")
        .where("userId", "==", userId)
        .get();

      const applications: any[] = [];
      snapshot.forEach((doc: any) => {
        applications.push({ id: doc.id, ...doc.data() });
      });

      res.status(200).json({ applications });
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
