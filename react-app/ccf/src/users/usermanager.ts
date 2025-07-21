import { db, auth, functions } from '../index';
import { collection, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { UserData } from '../types/usertypes';
import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

// Function to add a new applicant user
export const addApplicantUser = async (userData: UserData, password: string): Promise<void> => {
  var user : any = null
  const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password).catch((e) => {
    console.log("User could not be created: " + e);
    throw e;
  });
  try {
    const addApplicantRole = httpsCallable(functions, "addApplicantRole");
    user = userCredential.user;

    await sendEmailVerification(user);
    await setDoc(doc(db, "applicants", user.uid), {
      firstName: userData.firstName,
      lastName: userData.lastName,
      title: userData.title,
      email: userData.email,
      affiliation: userData.affiliation
    });
    await addApplicantRole({ email: userData.email })
      .then((result) => {
        console.log(result.data); // Success message from the function
      })
      .catch((error) => {
        throw error
      });
  } catch (e) {
    if (user !== null) {
      await deleteUser(user);
      await deleteDoc(doc(db, "applicants", user.uid));
    }
    console.error(e);
  }
};

// Function to add a new reviewer user
export const addReviewerUser = async (userData: UserData, password: string): Promise<void> => {
  var user : any = null
  const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password).catch((e) => {
    console.log("User could not be created: " + e);
    throw e;
  });
  try {
    const addReviewerRole = httpsCallable(functions, "addReviewerRole");
    const user = userCredential.user;
    
    await sendEmailVerification(user);
    
    await setDoc(doc(db, "reviewers", user.uid), {
      firstName: userData.firstName,
      lastName: userData.lastName,
      title: userData.title,
      email: userData.email,
      affiliation: userData.affiliation
    });
    await addReviewerRole({ email: userData.email })
      .then((result) => {
        console.log(result.data); // Success message from the function
      })
      .catch((error) => {
        throw error
      });
  } catch (e) {
    if (user !== null) {
      await deleteUser(user);
      await deleteDoc(doc(db, "reviewers", user.uid));
    }
    console.error(e);
  }
};

// Function to edit an applicant user
export const editApplicantUser = async (userId: string, updates: Partial<UserData>): Promise<void> => {
  try {
    const userRef = doc(collection(db, 'applicants'), userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error editing applicant user:', error);
    throw error;
  }
};

// Function to edit a reviewer user
export const editReviewerUser = async (userId: string, updates: Partial<UserData>): Promise<void> => {
  try {
    const userRef = doc(collection(db, 'reviewers'), userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error editing reviewer user:', error);
    throw error;
  }
};

// Function to get an applicant user
export const getApplicantUser = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(collection(db, 'applicants'), userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting applicant user:', error);
    throw error;
  }
};

// Function to get a reviewer user
export const getReviewerUser = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(collection(db, 'reviewers'), userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting reviewer user:', error);
    throw error;
  }
};

// Function to assign a reviewer to an application
export const assignApplicationToReviewer = async (userId: string, applicationId: string): Promise<void> => {
  try {
    const reviewerRef = doc(collection(db, 'reviewerUsers'), userId);
    
    //snapshot
    const reviewerSnap = await getDoc(reviewerRef);

    if (!reviewerSnap.exists()) {
      throw new Error(`Reviewer with ID ${userId} does not exist`);
    }

    const reviewerData = reviewerSnap.data();
    const assignedApplications = reviewerData.assignedApplications || [];

    // Avoid duplicates
    if (!assignedApplications.includes(applicationId)) {
      assignedApplications.push(applicationId);
    }

    await updateDoc(reviewerRef, {
      assignedApplications,
    });

    // update the application to include the reviewer too
    const appRef = doc(collection(db, 'applications'), applicationId);
    const appSnap = await getDoc(appRef);
    if (appSnap.exists()) {
      const appData = appSnap.data();
      const assignedReviewers = appData.assignedReviewers || [];

      if (!assignedReviewers.includes(userId)) {
        assignedReviewers.push(userId);
        await updateDoc(appRef, {
          assignedReviewers,
        });
      }
    }

    // warning if it didn't work
  } catch (error) {
    console.error('Error assigning application to reviewer:', error);
    throw error;
  }
};
