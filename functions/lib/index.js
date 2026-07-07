"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
Object.defineProperty(exports, "__esModule", {value: true});
exports.getApplicationReviews = exports.getReviewers = exports.submitApplication = exports.syncCurrentCycleStage = exports.addAdminRole = exports.addApplicantRole = exports.addReviewerRole = exports.helloWorld = void 0;
const functions = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
const hasDeadlinePassed = (deadlineValue) => {
  if (!deadlineValue) {
    return false;
  }
  const deadlineDate = typeof deadlineValue.toDate === "function" ?
    deadlineValue.toDate() :
    new Date(deadlineValue);
  return Date.now() > deadlineDate.getTime();
};
const syncCurrentCycleStageIfNeeded = async (cycleDoc) => {
  const currentCycle = cycleDoc.data();
  if (currentCycle.stage === "Applications Open" &&
        currentCycle.applicationsReopenedManually !== true &&
        hasDeadlinePassed(currentCycle.allApplicationsDeadline)) {
    await cycleDoc.ref.update({
      stage: "Applications Closed",
      applicationsReopenedManually: false,
    });
    currentCycle.stage = "Applications Closed";
    currentCycle.applicationsReopenedManually = false;
  }
  return currentCycle;
};

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
exports.helloWorld = onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.addReviewerRole = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }
  if (!data || !data.email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }
  const isAdmin = auth.token.role === "admin";
  const isSelf = !!auth.token.email && auth.token.email.toLowerCase() === String(data.email).toLowerCase();
  if (!isAdmin && !isSelf) {
    throw new functions.https.HttpsError("permission-denied", "You can only assign the reviewer role to your own account");
  }
  try {
    if (!isAdmin) {
      const wl = await admin.firestore()
        .collection("reviewer-whitelist")
        .where("email", "==", String(data.email).toLowerCase().trim())
        .get();
      const allowed = wl.docs.some((d) => d.data().status !== "inactive");
      if (!allowed) {
        throw new functions.https.HttpsError("permission-denied", "This email is not on the reviewer whitelist");
      }
    }
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, {"role": "reviewer"});
    // Also create the user document in the reviewers collection
    await admin.firestore().collection("reviewers").doc(data.userId || user.uid).set({
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      title: data.title || "",
      email: data.email,
      affiliation: data.affiliation || "",
    });
    return {message: `Success! ${data.email} has been made a reviewer.`};
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    console.error("Error in addReviewerRole:", err);
    throw new functions.https.HttpsError("internal", "Failed to assign reviewer role");
  }
});

exports.addApplicantRole = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }
  if (!data || !data.email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }
  const isAdmin = auth.token.role === "admin";
  const isSelf = !!auth.token.email && auth.token.email.toLowerCase() === String(data.email).toLowerCase();
  if (!isAdmin && !isSelf) {
    throw new functions.https.HttpsError("permission-denied", "You can only assign the applicant role to your own account");
  }
  try {
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, {"role": "applicant"});
    return {message: `Success! ${data.email} has been made an applicant.`};
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    console.error("Error in addApplicantRole:", err);
    throw new functions.https.HttpsError("internal", "Failed to assign applicant role");
  }
});

exports.addAdminRole = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }
  if (auth.token.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can assign the admin role");
  }
  if (!data || !data.email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }
  try {
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, {"role": "admin"});
    return {message: `Success! ${data.email} has been made an admin.`};
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    console.error("Error in addAdminRole:", err);
    throw new functions.https.HttpsError("internal", "Failed to assign admin role");
  }
});

exports.syncCurrentCycleStage = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }
  const cycleSnapshot = await admin.firestore()
    .collection("applicationCycles")
    .where("current", "==", true)
    .limit(1)
    .get();
  if (cycleSnapshot.empty) {
    throw new functions.https.HttpsError("failed-precondition", "No active application cycle found");
  }
  const currentCycle = await syncCurrentCycleStageIfNeeded(cycleSnapshot.docs[0]);
  return {
    stage: currentCycle.stage,
    applicationsReopenedManually: currentCycle.applicationsReopenedManually === true,
  };
});

// Secure Application Submission Function
exports.submitApplication = onCall(async (request) => {
  try {
    const {data, auth} = request;

    // 1. Authentication Check
    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to submit applications");
    }

    const userId = auth.uid;
    const userEmail = auth.token.email;

    // 2. Validate user role
    const userRole = auth.token.role;
    if (userRole !== "applicant") {
      throw new functions.https.HttpsError("permission-denied", "Only applicants can submit applications");
    }

    // 3. Validate required data
    const {application, grantType, storedFileName, originalFileName} = data;

    // Old clients sent the PDF base64-encoded through the callable; the file
    // now goes directly to Storage and only its object name is sent here.
    if (data.fileData) {
      throw new functions.https.HttpsError("failed-precondition", "This app version is outdated — please refresh your browser and try again.");
    }

    if (!application || !grantType || !storedFileName) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required application data");
    }

    if (!["research", "nextgen", "nonresearch"].includes(grantType)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid grant type");
    }

    // 4. Reject path tricks before any storage access
    if (typeof storedFileName !== "string" || storedFileName.includes("/") || storedFileName.includes("..")) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid file reference");
    }

    // 5. Get current application cycle and validate submission period
    const cycleSnapshot = await admin.firestore()
      .collection("applicationCycles")
      .where("current", "==", true)
      .limit(1)
      .get();

    if (cycleSnapshot.empty) {
      throw new functions.https.HttpsError("failed-precondition", "No active application cycle found");
    }

    const currentCycleDoc = cycleSnapshot.docs[0];
    const currentCycle = await syncCurrentCycleStageIfNeeded(currentCycleDoc);
    // Check if applications are open
    if (currentCycle.stage !== "Applications Open") {
      throw new functions.https.HttpsError("failed-precondition", "Applications are currently closed");
    }

    // 6. Multiple applications are now allowed within the same cycle
    // Removed duplicate submission check to allow multiple applications per cycle

    // 7. Validate application data based on grant type
    const validationResult = validateApplicationData(application, grantType);
    if (!validationResult.isValid) {
      throw new functions.https.HttpsError("invalid-argument", `Invalid application data: ${validationResult.errors.join(", ")}`);
    }

    // 8. Verify the client-uploaded file in Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(`pdfs/${storedFileName}`);
    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError("failed-precondition", "Uploaded file not found — please re-attach your PDF and try again.");
    }
    const [meta] = await file.getMetadata();
    if (meta.contentType !== "application/pdf") {
      throw new functions.https.HttpsError("invalid-argument", "Only PDF files are allowed");
    }
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (Number(meta.size) > MAX_FILE_SIZE) {
      throw new functions.https.HttpsError("invalid-argument", "File size exceeds 50MB limit");
    }
    const uploadedBy = meta.metadata && meta.metadata.uploadedBy;
    if (uploadedBy !== userId) {
      throw new functions.https.HttpsError("permission-denied", "File was not uploaded by this user");
    }

    // Content check: the object must actually be a PDF, not just labeled one.
    const [head] = await file.download({start: 0, end: 4});
    if (head.length < 5 || head.toString("ascii") !== "%PDF-") {
      throw new functions.https.HttpsError("invalid-argument", "Uploaded file is not a valid PDF");
    }

    const fileId = admin.firestore().collection("applications").doc().id;

    // Link the object to its application (merges with existing custom
    // metadata; uploadedBy survives).
    await file.setMetadata({
      metadata: {
        applicationId: fileId,
        originalName: originalFileName || "",
      },
    });

    // 9. Create application document
    // Strip server/review-managed fields so the client payload cannot inject
    // them (mass-assignment guard). Keep in sync with new server-managed fields.
    const PROTECTED_APP_FIELDS = [
      "status", "decision", "creatorId", "applicationId", "grantType", "file",
      "applicationCycle", "submitTime", "reviewStatus", "averageScore",
      "primaryScore", "secondaryScore", "assignedReviewers", "lastUpdated",
    ];
    const sanitizedApplication = {...application};
    for (const field of PROTECTED_APP_FIELDS) {
      delete sanitizedApplication[field];
    }
    const applicationDetails = {
      ...sanitizedApplication,
      status: "submitted",
      decision: "pending",
      creatorId: userId,
      applicationId: fileId,
      grantType: grantType,
      file: storedFileName,
      applicationCycleId: currentCycleDoc.id,
      applicationCycle: currentCycle.name,
      submitTime: admin.firestore.Timestamp.now(),
    };

    await admin.firestore()
      .collection("applications")
      .doc(fileId)
      .set(applicationDetails);

    // 10. Log the submission
    functions.logger.info("Application submitted successfully", {
      userId,
      userEmail,
      grantType,
      applicationId: fileId,
      cycle: currentCycle.name,
    });

    return {
      success: true,
      applicationId: fileId,
      message: "Application submitted successfully",
    };
  } catch (error) {
    functions.logger.error("Application submission error:", error);

    // If it's already an HttpsError, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Otherwise, wrap in internal error
    throw new functions.https.HttpsError("internal", "Application submission failed");
  }
});

// Helper function to validate application data
function validateApplicationData(application, grantType) {
  const errors = [];

  // Common validation
  if (!application.title || typeof application.title !== "string" || application.title.trim() === "") {
    errors.push("Title is required");
  }

  if (!application.institution || typeof application.institution !== "string" || application.institution.trim() === "") {
    errors.push("Institution is required");
  }

  if (!application.amountRequested || typeof application.amountRequested !== "string" || application.amountRequested.trim() === "") {
    errors.push("Amount requested is required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (grantType === "research" || grantType === "nextgen") {
    // Research/NextGen specific validation - only require fields marked with * on the form
    if (!application.principalInvestigator || typeof application.principalInvestigator !== "string" || application.principalInvestigator.trim() === "") {
      errors.push("Principal Investigator is required");
    }

    // Department and Department Head are starred in the form
    if (!application.department || typeof application.department !== "string" || application.department.trim() === "") {
      errors.push("Department is required");
    }
    if (!application.departmentHead || typeof application.departmentHead !== "string" || application.departmentHead.trim() === "") {
      errors.push("Department Head is required");
    }

    if (!application.typesOfCancerAddressed || typeof application.typesOfCancerAddressed !== "string" || application.typesOfCancerAddressed.trim() === "") {
      errors.push("Types of Cancer Addressed is required");
    }

    if (!application.institutionAddress || typeof application.institutionAddress !== "string" || application.institutionAddress.trim() === "") {
      errors.push("Institution Address is required");
    }
    if (!application.institutionCityStateZip || typeof application.institutionCityStateZip !== "string" || application.institutionCityStateZip.trim() === "") {
      errors.push("Institution City/State/Zip is required");
    }

    if (!application.institutionPhoneNumber || typeof application.institutionPhoneNumber !== "string" || application.institutionPhoneNumber.trim() === "") {
      errors.push("Institution Phone Number is required");
    }

    if (!application.institutionEmail || !emailRegex.test(application.institutionEmail)) {
      errors.push("Valid Institution Email is required");
    }

    if (!application.adminOfficialName || typeof application.adminOfficialName !== "string" || application.adminOfficialName.trim() === "") {
      errors.push("Admin Official Name is required");
    }
    if (!application.adminOfficialAddress || typeof application.adminOfficialAddress !== "string" || application.adminOfficialAddress.trim() === "") {
      errors.push("Admin Official Address is required");
    }
    if (!application.adminOfficialCityStateZip || typeof application.adminOfficialCityStateZip !== "string" || application.adminOfficialCityStateZip.trim() === "") {
      errors.push("Admin City/State/Zip is required");
    }

    if (!application.adminPhoneNumber || typeof application.adminPhoneNumber !== "string" || application.adminPhoneNumber.trim() === "") {
      errors.push("Admin Phone Number is required");
    }

    if (!application.adminEmail || !emailRegex.test(application.adminEmail)) {
      errors.push("Valid Admin Email is required");
    }

    if (!application.includedPublishedPaper || typeof application.includedPublishedPaper !== "string" || application.includedPublishedPaper.trim() === "") {
      errors.push("Published Paper information is required");
    }

    if (!application.creditAgreement || typeof application.creditAgreement !== "string" || application.creditAgreement.trim() === "") {
      errors.push("Credit Agreement is required");
    }

    if (!application.patentApplied || typeof application.patentApplied !== "string" || application.patentApplied.trim() === "") {
      errors.push("Patent Applied information is required");
    }

    if (!application.includedFundingInfo || typeof application.includedFundingInfo !== "string" || application.includedFundingInfo.trim() === "") {
      errors.push("Funding Information is required");
    }

    if (!application.dates || typeof application.dates !== "string" || application.dates.trim() === "") {
      errors.push("Dates are required");
    }

    if (!application.einNumber || typeof application.einNumber !== "string" || application.einNumber.trim() === "") {
      errors.push("EIN Number is required");
    }

    if (!application.signaturePI || typeof application.signaturePI !== "string" || application.signaturePI.trim() === "") {
      errors.push("Signature of Principal Investigator is required");
    }
    if (!application.signatureDeptHead || typeof application.signatureDeptHead !== "string" || application.signatureDeptHead.trim() === "") {
      errors.push("Signature of Department Head is required");
    }

    // Note: Non-starred fields like otherStaff, coPI, continuation, continuationYears, and attestations are optional
  } else if (grantType === "nonresearch") {
    // Non-research specific validation
    if (!application.requestor || typeof application.requestor !== "string" || application.requestor.trim() === "") {
      errors.push("Requestor is required");
    }

    if (!application.institutionPhoneNumber || typeof application.institutionPhoneNumber !== "string" || application.institutionPhoneNumber.trim() === "") {
      errors.push("Institution Phone Number is required");
    }

    if (!application.institutionEmail || !emailRegex.test(application.institutionEmail)) {
      errors.push("Valid Institution Email is required");
    }

    if (!application.timeframe || typeof application.timeframe !== "string" || application.timeframe.trim() === "") {
      errors.push("Timeframe is required");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get Reviewers Function
exports.getReviewers = onRequest(async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    if (!match) {
      res.status(401).send("Unauthorized");
      return;
    }
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(match[1]);
    } catch (e) {
      res.status(401).send("Unauthorized");
      return;
    }
    if (decoded.role !== "admin" && decoded.role !== "reviewer") {
      res.status(403).send("Forbidden");
      return;
    }
    const reviewerUserIds = [];

    // Recursively list all users in batches of 100
    const listAllUsers = async (nextPageToken) => {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      listUsersResult.users.forEach((userRecord) => {
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

    res.status(200).json({reviewers: reviewerUserIds});
  } catch (error) {
    functions.logger.error("Error retrieving reviewers:", error);
    res.status(500).send("Failed to retrieve reviewers");
  }
});

// Get Application Reviews for Applicants
exports.getApplicationReviews = onCall(async (request) => {
  try {
    const {data, auth} = request;

    // 1. Authentication Check
    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to get reviews");
    }

    const userId = auth.uid;
    const userRole = auth.token.role;

    // 2. Validate user role - only applicants can get their own reviews
    if (userRole !== "applicant") {
      throw new functions.https.HttpsError("permission-denied", "Only applicants can get their own reviews");
    }

    // 3. Validate required data
    const {applicationId} = data;
    if (!applicationId) {
      throw new functions.https.HttpsError("invalid-argument", "Application ID is required");
    }

    // 4. Verify the application belongs to the requesting user
    const applicationRef = admin.firestore().collection("applications").doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Application not found");
    }

    const applicationData = applicationDoc.data();
    if (applicationData.creatorId !== userId) {
      throw new functions.https.HttpsError("permission-denied", "You can only access reviews for your own applications");
    }

    // 5. Get reviews for the application
    const reviewsRef = admin.firestore().collection("reviews").doc(applicationId).collection("reviewers");
    const reviewsSnapshot = await reviewsRef.get();

    const reviews = [];
    reviewsSnapshot.forEach((doc) => {
      const reviewData = doc.data();
      // Only return non-internal feedback to applicants
      const publicReview = {
        id: doc.id,
        reviewerType: reviewData.reviewerType,
        status: reviewData.status,
        feedback: {
          significance: reviewData.feedback?.significance || "",
          approach: reviewData.feedback?.approach || "",
          feasibility: reviewData.feedback?.feasibility || "",
          investigator: reviewData.feedback?.investigator || "",
          summary: reviewData.feedback?.summary || "",
          // Note: internal feedback is excluded for applicants
        },
      };
      reviews.push(publicReview);
    });

    const primaryReview = reviews.find((r) => r.reviewerType === "primary");
    const secondaryReview = reviews.find((r) => r.reviewerType === "secondary");

    return {
      applicationId,
      primaryReview,
      secondaryReview,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error getting application reviews:", error);
    throw new functions.https.HttpsError("internal", "Failed to get application reviews");
  }
});

// Update Application Review Status (Admin only)
exports.updateApplicationReviewStatus = onCall(async (request) => {
  try {
    const {data, auth} = request;

    // 1. Authentication Check
    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const userRole = auth.token.role;

    // 2. Validate user role - only admins can update application status
    if (userRole !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Only admins can update application review status");
    }

    // 3. Validate required data
    const {applicationId} = data;
    if (!applicationId) {
      throw new functions.https.HttpsError("invalid-argument", "Application ID is required");
    }

    // 4. Get reviews for the application
    const reviewsRef = admin.firestore().collection("reviews").doc(applicationId).collection("reviewers");
    const reviewsSnapshot = await reviewsRef.get();

    const reviews = [];
    reviewsSnapshot.forEach((doc) => {
      const reviewData = doc.data();
      reviews.push({
        id: doc.id,
        ...reviewData,
      });
    });

    const primaryReview = reviews.find((r) => r.reviewerType === "primary");
    const secondaryReview = reviews.find((r) => r.reviewerType === "secondary");

    // 5. Update application status based on review completion
    const applicationRef = admin.firestore().collection("applications").doc(applicationId);

    if (primaryReview?.status === "completed" && secondaryReview?.status === "completed") {
      // Both reviews completed - calculate average score
      const primaryScore = primaryReview.score || 0;
      const secondaryScore = secondaryReview.score || 0;
      const averageScore = (primaryScore + secondaryScore) / 2;

      await applicationRef.update({
        reviewStatus: "completed",
        averageScore: averageScore,
        primaryScore: primaryScore,
        secondaryScore: secondaryScore,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Application review status updated to completed",
        averageScore: averageScore,
      };
    } else if (primaryReview || secondaryReview) {
      // At least one reviewer assigned but not both completed
      await applicationRef.update({
        reviewStatus: "in-progress",
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Application review status updated to in-progress",
      };
    } else {
      // No reviewers assigned
      await applicationRef.update({
        reviewStatus: "not-started",
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Application review status updated to not-started",
      };
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error updating application review status:", error);
    throw new functions.https.HttpsError("internal", "Failed to update application review status");
  }
});

// Trigger Application Review Status Update (Reviewer only)
exports.triggerApplicationStatusUpdate = onCall(async (request) => {
  try {
    const {data, auth} = request;

    // 1. Authentication Check
    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const userRole = auth.token.role;

    // 2. Validate user role - only reviewers can trigger status updates
    if (userRole !== "reviewer") {
      throw new functions.https.HttpsError("permission-denied", "Only reviewers can trigger application status updates");
    }

    // 3. Validate required data
    const {applicationId} = data;
    if (!applicationId) {
      throw new functions.https.HttpsError("invalid-argument", "Application ID is required");
    }

    // 4. Verify the reviewer has a review for this application
    const reviewsRef = admin.firestore().collection("reviews").doc(applicationId).collection("reviewers");
    const reviewerReviewsQuery = reviewsRef.where("reviewerId", "==", auth.uid);
    const reviewerReviewsSnapshot = await reviewerReviewsQuery.get();

    if (reviewerReviewsSnapshot.empty) {
      throw new functions.https.HttpsError("permission-denied", "You do not have a review assignment for this application");
    }

    // 5. Get all reviews for the application
    const allReviewsSnapshot = await reviewsRef.get();

    const reviews = [];
    allReviewsSnapshot.forEach((doc) => {
      const reviewData = doc.data();
      reviews.push({
        id: doc.id,
        ...reviewData,
      });
    });

    const primaryReview = reviews.find((r) => r.reviewerType === "primary");
    const secondaryReview = reviews.find((r) => r.reviewerType === "secondary");

    // 6. Update application status based on review completion
    const applicationRef = admin.firestore().collection("applications").doc(applicationId);

    if (primaryReview?.status === "completed" && secondaryReview?.status === "completed") {
      // Both reviews completed - calculate average score
      const primaryScore = primaryReview.score || 0;
      const secondaryScore = secondaryReview.score || 0;
      const averageScore = (primaryScore + secondaryScore) / 2;

      await applicationRef.update({
        reviewStatus: "completed",
        averageScore: averageScore,
        primaryScore: primaryScore,
        secondaryScore: secondaryScore,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Application review status updated to completed",
        averageScore: averageScore,
      };
    } else if (primaryReview || secondaryReview) {
      // At least one reviewer assigned but not both completed
      await applicationRef.update({
        reviewStatus: "in-progress",
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Application review status updated to in-progress",
      };
    } else {
      // No reviewers assigned
      await applicationRef.update({
        reviewStatus: "not-started",
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Application review status updated to not-started",
      };
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error triggering application review status update:", error);
    throw new functions.https.HttpsError("internal", "Failed to trigger application review status update");
  }
});

