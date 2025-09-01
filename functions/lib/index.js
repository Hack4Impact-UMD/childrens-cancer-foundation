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
exports.getApplicationReviews = exports.getReviewers = exports.submitApplication = exports.addAdminRole = exports.addApplicantRole = exports.addReviewerRole = exports.helloWorld = void 0;
const functions = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
exports.helloWorld = onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

exports.addReviewerRole = onCall((request) => {
    const { data } = request;
    return admin.auth().getUserByEmail(data.email).then((user) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            "role": "reviewer"
        });
    }).then(() => {
        // Also create the user document in the reviewers collection
        return admin.firestore().collection('reviewers').doc(data.userId).set({
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
            email: data.email,
            affiliation: data.affiliation
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been made a reviewer.`
        };
    }).catch((err) => {
        console.error("Error in addReviewerRole:", err);
        throw new functions.https.HttpsError('internal', 'Failed to assign reviewer role');
    });
});

exports.addApplicantRole = onCall((request) => {
    const { data } = request;
    return admin.auth().getUserByEmail(data.email).then((user) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            "role": "applicant"
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been made an applicant.`
        };
    }).catch((err) => {
        console.error("Error in addApplicantRole:", err);
        throw new functions.https.HttpsError('internal', 'Failed to assign applicant role');
    });
});

exports.addAdminRole = onCall((request) => {
    const { data } = request;
    return admin.auth().getUserByEmail(data.email).then((user) => {
        return admin.auth().setCustomUserClaims(user.uid, {
            "role": "admin"
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been made an admin.`
        };
    }).catch((err) => {
        console.error("Error in addAdminRole:", err);
        throw new functions.https.HttpsError('internal', 'Failed to assign admin role');
    });
});

// Secure Application Submission Function
exports.submitApplication = onCall(async (request) => {
    try {
        const { data, auth } = request;

        // 1. Authentication Check
        if (!auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to submit applications');
        }

        const userId = auth.uid;
        const userEmail = auth.token.email;

        // 2. Validate user role
        const userRole = auth.token.role;
        if (userRole !== 'applicant') {
            throw new functions.https.HttpsError('permission-denied', 'Only applicants can submit applications');
        }

        // 3. Validate required data
        const { application, grantType, fileData, fileName, fileType } = data;

        if (!application || !grantType || !fileData || !fileName) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required application data');
        }

        if (!['research', 'nextgen', 'nonresearch'].includes(grantType)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid grant type');
        }

        // 4. Validate file type and size
        if (fileType !== 'application/pdf') {
            throw new functions.https.HttpsError('invalid-argument', 'Only PDF files are allowed');
        }

        const fileBuffer = Buffer.from(fileData, 'base64');
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (fileBuffer.length > MAX_FILE_SIZE) {
            throw new functions.https.HttpsError('invalid-argument', 'File size exceeds 50MB limit');
        }

        // 5. Get current application cycle and validate submission period
        const cycleSnapshot = await admin.firestore()
            .collection('applicationCycles')
            .where('current', '==', true)
            .limit(1)
            .get();

        if (cycleSnapshot.empty) {
            throw new functions.https.HttpsError('failed-precondition', 'No active application cycle found');
        }

        const currentCycle = cycleSnapshot.docs[0].data();
        const now = new Date();

        // Check if applications are open
        if (currentCycle.stage !== 'Applications Open') {
            throw new functions.https.HttpsError('failed-precondition', 'Applications are currently closed');
        }

        // Check deadline based on grant type
        let deadline;
        switch (grantType) {
            case 'research':
                deadline = currentCycle.researchDeadline.toDate();
                break;
            case 'nextgen':
                deadline = currentCycle.nextGenDeadline.toDate();
                break;
            case 'nonresearch':
                deadline = currentCycle.nonResearchDeadline.toDate();
                break;
        }

        if (now > deadline) {
            throw new functions.https.HttpsError('failed-precondition', `Deadline for ${grantType} applications has passed`);
        }

        // 6. Multiple applications are now allowed within the same cycle
        // Removed duplicate submission check to allow multiple applications per cycle

        // 7. Validate application data based on grant type
        const validationResult = validateApplicationData(application, grantType);
        if (!validationResult.isValid) {
            throw new functions.https.HttpsError('invalid-argument', `Invalid application data: ${validationResult.errors.join(', ')}`);
        }

        // 8. Upload file to Firebase Storage
        const fileId = admin.firestore().collection('applications').doc().id;
        const fileName_storage = `${fileId}_${Date.now()}.pdf`;
        const bucket = admin.storage().bucket();
        const file = bucket.file(`pdfs/${fileName_storage}`);

        await file.save(fileBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    uploadedBy: userId,
                    originalName: fileName,
                    applicationId: fileId
                }
            }
        });

        // 9. Create application document
        const applicationDetails = {
            ...application,
            decision: 'pending',
            creatorId: userId,
            applicationId: fileId,
            grantType: grantType,
            file: fileName_storage,
            applicationCycle: currentCycle.name,
            submitTime: admin.firestore.Timestamp.now()
        };

        await admin.firestore()
            .collection('applications')
            .doc(fileId)
            .set(applicationDetails);

        // 10. Log the submission
        functions.logger.info('Application submitted successfully', {
            userId,
            userEmail,
            grantType,
            applicationId: fileId,
            cycle: currentCycle.name
        });

        return {
            success: true,
            applicationId: fileId,
            message: 'Application submitted successfully'
        };

    } catch (error) {
        functions.logger.error('Application submission error:', error);

        // If it's already an HttpsError, re-throw it
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        // Otherwise, wrap in internal error
        throw new functions.https.HttpsError('internal', 'Application submission failed');
    }
});

// Helper function to validate application data
function validateApplicationData(application, grantType) {

    const errors = [];

    // Common validation
    if (!application.title || typeof application.title !== 'string' || application.title.trim() === '') {
        errors.push('Title is required');
    }

    if (!application.institution || typeof application.institution !== 'string' || application.institution.trim() === '') {
        errors.push('Institution is required');
    }

    if (!application.amountRequested || typeof application.amountRequested !== 'string' || application.amountRequested.trim() === '') {
        errors.push('Amount requested is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (grantType === 'research' || grantType === 'nextgen') {
        // Research/NextGen specific validation - only require fields marked with * on the form
        if (!application.principalInvestigator || typeof application.principalInvestigator !== 'string' || application.principalInvestigator.trim() === '') {
            errors.push('Principal Investigator is required');
        }

        // Department and Department Head are starred in the form
        if (!application.department || typeof application.department !== 'string' || application.department.trim() === '') {
            errors.push('Department is required');
        }
        if (!application.departmentHead || typeof application.departmentHead !== 'string' || application.departmentHead.trim() === '') {
            errors.push('Department Head is required');
        }

        if (!application.typesOfCancerAddressed || typeof application.typesOfCancerAddressed !== 'string' || application.typesOfCancerAddressed.trim() === '') {
            errors.push('Types of Cancer Addressed is required');
        }

        if (!application.institutionAddress || typeof application.institutionAddress !== 'string' || application.institutionAddress.trim() === '') {
            errors.push('Institution Address is required');
        }
        if (!application.institutionCityStateZip || typeof application.institutionCityStateZip !== 'string' || application.institutionCityStateZip.trim() === '') {
            errors.push('Institution City/State/Zip is required');
        }

        if (!application.institutionPhoneNumber || typeof application.institutionPhoneNumber !== 'string' || application.institutionPhoneNumber.trim() === '') {
            errors.push('Institution Phone Number is required');
        }

        if (!application.institutionEmail || !emailRegex.test(application.institutionEmail)) {
            errors.push('Valid Institution Email is required');
        }

        if (!application.adminOfficialName || typeof application.adminOfficialName !== 'string' || application.adminOfficialName.trim() === '') {
            errors.push('Admin Official Name is required');
        }
        if (!application.adminOfficialAddress || typeof application.adminOfficialAddress !== 'string' || application.adminOfficialAddress.trim() === '') {
            errors.push('Admin Official Address is required');
        }
        if (!application.adminOfficialCityStateZip || typeof application.adminOfficialCityStateZip !== 'string' || application.adminOfficialCityStateZip.trim() === '') {
            errors.push('Admin City/State/Zip is required');
        }

        if (!application.adminPhoneNumber || typeof application.adminPhoneNumber !== 'string' || application.adminPhoneNumber.trim() === '') {
            errors.push('Admin Phone Number is required');
        }

        if (!application.adminEmail || !emailRegex.test(application.adminEmail)) {
            errors.push('Valid Admin Email is required');
        }

        if (!application.includedPublishedPaper || typeof application.includedPublishedPaper !== 'string' || application.includedPublishedPaper.trim() === '') {
            errors.push('Published Paper information is required');
        }

        if (!application.creditAgreement || typeof application.creditAgreement !== 'string' || application.creditAgreement.trim() === '') {
            errors.push('Credit Agreement is required');
        }

        if (!application.patentApplied || typeof application.patentApplied !== 'string' || application.patentApplied.trim() === '') {
            errors.push('Patent Applied information is required');
        }

        if (!application.includedFundingInfo || typeof application.includedFundingInfo !== 'string' || application.includedFundingInfo.trim() === '') {
            errors.push('Funding Information is required');
        }

        if (!application.dates || typeof application.dates !== 'string' || application.dates.trim() === '') {
            errors.push('Dates are required');
        }

        if (!application.einNumber || typeof application.einNumber !== 'string' || application.einNumber.trim() === '') {
            errors.push('EIN Number is required');
        }

        if (!application.signaturePI || typeof application.signaturePI !== 'string' || application.signaturePI.trim() === '') {
            errors.push('Signature of Principal Investigator is required');
        }
        if (!application.signatureDeptHead || typeof application.signatureDeptHead !== 'string' || application.signatureDeptHead.trim() === '') {
            errors.push('Signature of Department Head is required');
        }

        // Note: Non-starred fields like otherStaff, coPI, continuation, continuationYears, and attestations are optional

    } else if (grantType === 'nonresearch') {
        // Non-research specific validation
        if (!application.requestor || typeof application.requestor !== 'string' || application.requestor.trim() === '') {
            errors.push('Requestor is required');
        }

        if (!application.institutionPhoneNumber || typeof application.institutionPhoneNumber !== 'string' || application.institutionPhoneNumber.trim() === '') {
            errors.push('Institution Phone Number is required');
        }

        if (!application.institutionEmail || !emailRegex.test(application.institutionEmail)) {
            errors.push('Valid Institution Email is required');
        }

        if (!application.timeframe || typeof application.timeframe !== 'string' || application.timeframe.trim() === '') {
            errors.push('Timeframe is required');
        }

    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Get Reviewers Function
exports.getReviewers = onRequest(async (req, res) => {
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

// Get Application Reviews for Applicants
exports.getApplicationReviews = onCall(async (request) => {
    try {
        const { data, auth } = request;

        // 1. Authentication Check
        if (!auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to get reviews');
        }

        const userId = auth.uid;
        const userRole = auth.token.role;

        // 2. Validate user role - only applicants can get their own reviews
        if (userRole !== 'applicant') {
            throw new functions.https.HttpsError('permission-denied', 'Only applicants can get their own reviews');
        }

        // 3. Validate required data
        const { applicationId } = data;
        if (!applicationId) {
            throw new functions.https.HttpsError('invalid-argument', 'Application ID is required');
        }

        // 4. Verify the application belongs to the requesting user
        const applicationRef = admin.firestore().collection('applications').doc(applicationId);
        const applicationDoc = await applicationRef.get();

        if (!applicationDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Application not found');
        }

        const applicationData = applicationDoc.data();
        if (applicationData.creatorId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'You can only access reviews for your own applications');
        }

        // 5. Get reviews for the application
        const reviewsRef = admin.firestore().collection('reviews').doc(applicationId).collection('reviewers');
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
                    significance: reviewData.feedback?.significance || '',
                    approach: reviewData.feedback?.approach || '',
                    feasibility: reviewData.feedback?.feasibility || '',
                    investigator: reviewData.feedback?.investigator || '',
                    summary: reviewData.feedback?.summary || ''
                    // Note: internal feedback is excluded for applicants
                }
            };
            reviews.push(publicReview);
        });

        const primaryReview = reviews.find(r => r.reviewerType === 'primary');
        const secondaryReview = reviews.find(r => r.reviewerType === 'secondary');

        return {
            applicationId,
            primaryReview,
            secondaryReview
        };

    } catch (error) {
        functions.logger.error("Error getting application reviews:", error);
        throw new functions.https.HttpsError('internal', 'Failed to get application reviews');
    }
});

// Update Application Review Status (Admin only)
exports.updateApplicationReviewStatus = onCall(async (request) => {
    try {
        const { data, auth } = request;

        // 1. Authentication Check
        if (!auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const userRole = auth.token.role;

        // 2. Validate user role - only admins can update application status
        if (userRole !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can update application review status');
        }

        // 3. Validate required data
        const { applicationId } = data;
        if (!applicationId) {
            throw new functions.https.HttpsError('invalid-argument', 'Application ID is required');
        }

        // 4. Get reviews for the application
        const reviewsRef = admin.firestore().collection('reviews').doc(applicationId).collection('reviewers');
        const reviewsSnapshot = await reviewsRef.get();

        const reviews = [];
        reviewsSnapshot.forEach((doc) => {
            const reviewData = doc.data();
            reviews.push({
                id: doc.id,
                ...reviewData
            });
        });

        const primaryReview = reviews.find(r => r.reviewerType === 'primary');
        const secondaryReview = reviews.find(r => r.reviewerType === 'secondary');

        // 5. Update application status based on review completion
        const applicationRef = admin.firestore().collection('applications').doc(applicationId);

        if (primaryReview?.status === 'completed' && secondaryReview?.status === 'completed') {
            // Both reviews completed - calculate average score
            const primaryScore = primaryReview.score || 0;
            const secondaryScore = secondaryReview.score || 0;
            const averageScore = (primaryScore + secondaryScore) / 2;

            await applicationRef.update({
                reviewStatus: 'completed',
                averageScore: averageScore,
                primaryScore: primaryScore,
                secondaryScore: secondaryScore,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Application review status updated to completed',
                averageScore: averageScore
            };
        } else if (primaryReview || secondaryReview) {
            // At least one reviewer assigned but not both completed
            await applicationRef.update({
                reviewStatus: 'in-progress',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Application review status updated to in-progress'
            };
        } else {
            // No reviewers assigned
            await applicationRef.update({
                reviewStatus: 'not-started',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Application review status updated to not-started'
            };
        }

    } catch (error) {
        functions.logger.error("Error updating application review status:", error);
        throw new functions.https.HttpsError('internal', 'Failed to update application review status');
    }
});

// Trigger Application Review Status Update (Reviewer only)
exports.triggerApplicationStatusUpdate = onCall(async (request) => {
    try {
        const { data, auth } = request;

        // 1. Authentication Check
        if (!auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const userRole = auth.token.role;

        // 2. Validate user role - only reviewers can trigger status updates
        if (userRole !== 'reviewer') {
            throw new functions.https.HttpsError('permission-denied', 'Only reviewers can trigger application status updates');
        }

        // 3. Validate required data
        const { applicationId } = data;
        if (!applicationId) {
            throw new functions.https.HttpsError('invalid-argument', 'Application ID is required');
        }

        // 4. Verify the reviewer has a review for this application
        const reviewsRef = admin.firestore().collection('reviews').doc(applicationId).collection('reviewers');
        const reviewerReviewsQuery = reviewsRef.where('reviewerId', '==', auth.uid);
        const reviewerReviewsSnapshot = await reviewerReviewsQuery.get();

        if (reviewerReviewsSnapshot.empty) {
            throw new functions.https.HttpsError('permission-denied', 'You do not have a review assignment for this application');
        }

        // 5. Get all reviews for the application
        const allReviewsSnapshot = await reviewsRef.get();

        const reviews = [];
        allReviewsSnapshot.forEach((doc) => {
            const reviewData = doc.data();
            reviews.push({
                id: doc.id,
                ...reviewData
            });
        });

        const primaryReview = reviews.find(r => r.reviewerType === 'primary');
        const secondaryReview = reviews.find(r => r.reviewerType === 'secondary');

        // 6. Update application status based on review completion
        const applicationRef = admin.firestore().collection('applications').doc(applicationId);

        if (primaryReview?.status === 'completed' && secondaryReview?.status === 'completed') {
            // Both reviews completed - calculate average score
            const primaryScore = primaryReview.score || 0;
            const secondaryScore = secondaryReview.score || 0;
            const averageScore = (primaryScore + secondaryScore) / 2;

            await applicationRef.update({
                reviewStatus: 'completed',
                averageScore: averageScore,
                primaryScore: primaryScore,
                secondaryScore: secondaryScore,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Application review status updated to completed',
                averageScore: averageScore
            };
        } else if (primaryReview || secondaryReview) {
            // At least one reviewer assigned but not both completed
            await applicationRef.update({
                reviewStatus: 'in-progress',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Application review status updated to in-progress'
            };
        } else {
            // No reviewers assigned
            await applicationRef.update({
                reviewStatus: 'not-started',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: 'Application review status updated to not-started'
            };
        }

    } catch (error) {
        functions.logger.error("Error triggering application review status update:", error);
        throw new functions.https.HttpsError('internal', 'Failed to trigger application review status update');
    }
});

//# sourceMappingURL=index.js.map
