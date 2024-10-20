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
import * as sendgridMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error("SendGrid API key is not set in the environment variables.");
}
sendgridMail.setApiKey(apiKey);

// email sending function
export const sendEmail = functions.https.onRequest(async (req, res) => {
  // Extract email parameters from request body
  const { to, from, subject, text, html } = req.body;

  // Construct the email message
  const msg = {
    to,
    from,
    subject,
    text,  // Plain text content
    html,  // HTML content (optional)
  };

  try {
    // Send the email
    await sendgridMail.send(msg);
    console.log("Email sent successfully!");
    res.status(200).send("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email");
  }
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
