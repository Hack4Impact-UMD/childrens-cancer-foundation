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
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Define the structure of user and application objects
interface User {
  userId: string;
  name: string;
  email: string;
  institutionalAffiliation: string;
  principalInvestigator: string;
  receivedPriorCCFFunding: boolean;
  applyingFor: string;
  title: string;
}

interface Application {
  applicationID: string;
  adminEmail: string;
  adminOfficialAddress: string;
  adminOfficialName: string;
  adminPhoneNumber: string;
  amountRequested: number;
  continuation: boolean;
  continuationYears: string;
  creditAgreement: string;
  dates: string;
  includedFundingInfo: string;
  includedPublishedPaper: string;
  institution: string;
  institutionEmail: string;
  institutionAddress: string;
  institutionPhoneNumber: string;
  namesOfStaff: string;
  patentApplied: string;
  pdf: string;
  principalInvestigator: string;
  title: string;
  typesOfCancerAddressed: string;
}

// Main function to assign reviewers
export const assignReviewers = functions.https.onCall(async (data, context) => {
  try {
    // Fetch users from applicantUsers collection (used as reviewers)
    const usersSnapshot = await db.collection('applicantUsers').get();
    const applicationsSnapshot = await db.collection('Applications').get();

    // Convert snapshots to arrays
    const users: User[] = usersSnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as User));
    const applications: Application[] = applicationsSnapshot.docs.map(doc => ({ applicationID: doc.id, ...doc.data() } as Application));

    // Check if enough users are available
    if (users.length === 0) {
      throw new Error('No users found');
    }
    if (applications.length === 0) {
      throw new Error('No applications found');
    }

    // Shuffle users and applications (randomize)
    const shuffledUsers = shuffleArray(users);
    const shuffledApplications = shuffleArray(applications);

    // Map of applicationID to assigned reviewers
    const assignments: Record<string, string[]> = {};
    
    // Distribute reviewers to applications
    const numReviewersPerApplication = 3;
    let userIndex = 0;

    for (let i = 0; i < shuffledApplications.length; i++) {
      assignments[shuffledApplications[i].applicationID] = [];

      // Assign 3 reviewers to each application
      for (let j = 0; j < numReviewersPerApplication; j++) {
        assignments[shuffledApplications[i].applicationID].push(shuffledUsers[userIndex].userId);

        // Move to next user, wrap around if at the end
        userIndex = (userIndex + 1) % shuffledUsers.length;
      }
    }

    // Return the assignments or save to Firestore
    return { success: true, assignments };

  } catch (error) {
    if (error instanceof Error) {
        // Safely access the message property
        console.error('Error assigning reviewers:', error.message);
        return { success: false, message: error.message };
      } else {
        // Handle unknown errors gracefully
        console.error('Unknown error occurred:', error);
        return { success: false, message: 'An unknown error occurred.' };
      }
  }
});

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
