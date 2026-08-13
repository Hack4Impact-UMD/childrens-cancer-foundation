// import { addApplicantRole, addReviewerRole } from '.';
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";


// Out-of-band claim bootstrap. The role callables now enforce authorization
// (addAdminRole is admin-only; addReviewerRole requires the whitelist), so a
// brand-new account can't mint the first admin/reviewer through them. Only the
// Auth *emulator* accepts the privileged "Bearer owner" token — this code path
// only runs against emulators (see the useEmulator guard in index.tsx).
async function setEmulatorClaims(projectId: string, uid: string, role: string) {
    await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' },
        body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ role }) })
    });
}

export async function initializeTestAccounts(db: any, auth: any, functions: any) {

    const addApplicantRole = httpsCallable(functions, "addApplicantRole");
    const projectId = auth.app.options.projectId;

    const users = [
        { email: 'admin@test.com', password: 'P@ssword123', role: 'admin' },
        { email: 'reviewer@test.com', password: 'P@ssword123', role: 'reviewer' },
        { email: 'applicant@test.com', password: 'P@ssword123', role: 'applicant' }
    ];

    for (const user of users) {
        try {
            const userRecord = await createUserWithEmailAndPassword(auth, user.email, user.password);

            if (user.role === 'reviewer') {
                await setEmulatorClaims(projectId, userRecord.user.uid, 'reviewer');
                await setDoc(doc(db, 'reviewers', userRecord.user.uid), {
                    firstName: "reviewer",
                    lastName: "person",
                    affiliation: "reviewer hospital",
                    email: user.email,
                    role: user.role
                });
                console.log('Reviewer role added');
            } else if (user.role === 'applicant') {
                await setDoc(doc(db, 'applicants', userRecord.user.uid), {
                    firstName: "applicant",
                    lastName: "person",
                    affiliation: "applicant hospital",
                    email: user.email,
                    role: user.role
                });
                console.log('applicant role added');
                await addApplicantRole({ email: user.email });
            } else {
                await setDoc(doc(db, 'admins', userRecord.user.uid), {
                    firstName: "admin",
                    lastName: "person",
                    affiliation: "ccf",
                    email: user.email,
                    role: user.role
                });
                console.log('admin role added');
                await setEmulatorClaims(projectId, userRecord.user.uid, 'admin');
            }

        } catch (error) {
            console.error('Error creating user:', error);
        }
    }

    console.log('Test accounts initialized');
}

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

export async function initializeTestEnvironment(db: any, auth: any, functions: any) {
    const markerRef = doc(db, 'settings', 'testAccountsInitialized');

    const markerDoc = await getDoc(markerRef);
    if (markerDoc.exists()) {
        console.log('Test accounts already initialized.');
        return;
    }

    await initializeTestAccounts(db, auth, functions);

    await setDoc(markerRef, { initialized: true });
}
