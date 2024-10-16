/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import * as nodemailer from "nodemailer";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Set up nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL, // Your email from environment variable
    pass: process.env.SMTP_PASSWORD, // Your password from environment variable
  },
});

// Function to send an email
export const sendEmail = onRequest(async (req, res) => {
  const { to, subject, text, html } = req.body;

  const mailOptions = {
    from: process.env.SMTP_EMAIL, // Sender email from env variable
    to, // Recipient email
    subject, // Email subject
    text, // Plain text message
    html, // HTML content message
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully");
    res.status(200).send("Email sent successfully!");
  } catch (error) {
    logger.error("Error sending email:", error);
    res.status(500).send("Failed to send email.");
  }
});
