"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTestEnvironment = exports.initializeTestAccounts = void 0;
// import { addApplicantRole, addReviewerRole } from '.';
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const functions_1 = require("firebase/functions");
async function initializeTestAccounts(db, auth, functions) {
    const addApplicantRole = (0, functions_1.httpsCallable)(functions, "addApplicantRole");
    const addReviewerRole = (0, functions_1.httpsCallable)(functions, "addReviewerRole");
    const addAdminRole = (0, functions_1.httpsCallable)(functions, "addAdminRole");
    const users = [
        { email: 'admin@test.com', password: 'P@ssword123', role: 'admin' },
        { email: 'reviewer@test.com', password: 'P@ssword123', role: 'reviewer' },
        { email: 'applicant@test.com', password: 'P@ssword123', role: 'applicant' }
    ];
    for (const user of users) {
        try {
            const userRecord = await (0, auth_1.createUserWithEmailAndPassword)(auth, user.email, user.password);
            if (user.role === 'reviewer') {
                await addReviewerRole({ email: user.email });
                await (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'reviewers', userRecord.user.uid), {
                    firstName: "reviewer",
                    lastName: "person",
                    affiliation: "reviewer hospital",
                    email: user.email,
                    role: user.role
                });
                console.log('Reviewer role added');
            }
            else if (user.role === 'applicant') {
                await (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'applicants', userRecord.user.uid), {
                    firstName: "applicant",
                    lastName: "person",
                    affiliation: "applicant hospital",
                    email: user.email,
                    role: user.role
                });
                console.log('applicant role added');
                await addApplicantRole({ email: user.email });
            }
            else {
                await (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'admins', userRecord.user.uid), {
                    firstName: "admin",
                    lastName: "person",
                    affiliation: "ccf",
                    email: user.email,
                    role: user.role
                });
                console.log('admin role added');
                await addAdminRole({ email: user.email });
            }
        }
        catch (error) {
            console.error('Error creating user:', error);
        }
    }
    console.log('Test accounts initialized');
}
exports.initializeTestAccounts = initializeTestAccounts;
// export async function initializeDummyApplications(db: any) {
//     const applications = [
//         { applicationType: 'NextGen', status: 'FUNDED' },
//         { applicationType: 'Research Grant', status: 'NOT FUNDED' },
//         { applicationType: 'Research Grant', status: 'SUBMITTED: MAY 5, 2024' }
//     ];
//     for (const application of applications) {
//         await setDoc(doc(db, 'applications', application.applicationType), {
//             status: application.status
//         });
//     }
//     console.log('Dummy applications initialized');
// }
async function initializeTestEnvironment(db, auth, functions) {
    const markerRef = (0, firestore_1.doc)(db, 'settings', 'testAccountsInitialized');
    const markerDoc = await (0, firestore_1.getDoc)(markerRef);
    if (markerDoc.exists()) {
        console.log('Test accounts already initialized.');
        return;
    }
    await initializeTestAccounts(db, auth, functions);
    await (0, firestore_1.setDoc)(markerRef, { initialized: true });
}
exports.initializeTestEnvironment = initializeTestEnvironment;
//# sourceMappingURL=initialize-test-environment.js.map