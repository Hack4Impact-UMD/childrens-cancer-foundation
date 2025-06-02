"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewers = exports.addAdminRole = exports.addApplicantRole = exports.addReviewerRole = exports.helloWorld = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
exports.addReviewerRole = functions.https.onCall((data, context) => {
    return admin.auth().getUserByEmail(data.email).then((user) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            "role": "reviewer"
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been made a reviewer.`
        };
    }).catch((err) => {
        return err;
    });
});
exports.addApplicantRole = functions.https.onCall((data, context) => {
    return admin.auth().getUserByEmail(data.email).then((user) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            "role": "applicant"
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been made an applicant.`
        };
    }).catch((err) => {
        return err;
    });
});
exports.addAdminRole = functions.https.onCall((data, context) => {
    return admin.auth().getUserByEmail(data.email).then((user) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            "role": "admin"
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been made an admin.`
        };
    }).catch((err) => {
        return err;
    });
});

// Get Reviewers Function
exports.getReviewers = functions.https.onRequest(async (req, res) => {
    try {
        const reviewerUserIds = [];

        // Recursively list all users in batches of 100
        const listAllUsers = async (nextPageToken) => {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            listUsersResult.users.forEach(userRecord => {
                if (
                    userRecord.customClaims &&
                    userRecord.customClaims["role"] === "reviewer"
                ) {
                    reviewerUserIds.push(userRecord.uid);
                }
            });
            if (listUsersResult.pageToken) {
                await listAllUsers(listUsersResult.pageToken);
            }
        };

        await listAllUsers();

        res.status(200).json({ reviewers: reviewerUserIds });
    } catch (error) {
        functions.logger.error("Error retrieving reviewers:", error);
        res.status(500).send("Failed to retrieve reviewers");
    }
});
//# sourceMappingURL=index.js.map