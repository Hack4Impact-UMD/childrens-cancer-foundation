import { db } from '../index';
import { collection, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ApplicantUser, ReviewerUser } from '../types/usertypes';

// Function to add a new applicant user
export const addApplicantUser = async (user: ApplicantUser): Promise<void> => {
  try {
    if (!user.userId || !user.name || !user.title || !user.email || !user.institutionalAffiliation || !user.principalInvestigator) {
      throw new Error('Missing required fields: userId, name, title, email, institutionalAffiliation, or principalInvestigator');
    }
    const userRef = doc(collection(db, 'applicantUsers'), user.userId);
    await setDoc(userRef, user);
  } catch (error) {
    console.error('Error adding applicant user:', error);
    throw error;
  }
};

// Function to add a new reviewer user
export const addReviewerUser = async (user: ReviewerUser): Promise<void> => {
  try {
    if (!user.userId || !user.name || !user.email || !user.institutionalAffiliation) {
      throw new Error('Missing required fields: userId, name, email, or institutionalAffiliation');
    }
    const userRef = doc(collection(db, 'reviewerUsers'), user.userId);
    await setDoc(userRef, user);
  } catch (error) {
    console.error('Error adding reviewer user:', error);
    throw error;
  }
};

// Function to delete an applicant user
export const deleteApplicantUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(collection(db, 'applicantUsers'), userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting applicant user:', error);
    throw error;
  }
};

// Function to delete a reviewer user
export const deleteReviewerUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(collection(db, 'reviewerUsers'), userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting reviewer user:', error);
    throw error;
  }
};

// Function to edit an applicant user
export const editApplicantUser = async (userId: string, updates: Partial<ApplicantUser>): Promise<void> => {
  try {
    if (updates.email && updates.email.trim() === '') {
      throw new Error('Email cannot be empty');
    }
    if (updates.title && updates.title.trim() === '') {
      throw new Error('Title cannot be empty');
    }
    if (updates.institutionalAffiliation && updates.institutionalAffiliation.trim() === '') {
      throw new Error('Institutional Affiliation cannot be empty');
    }
    const userRef = doc(collection(db, 'applicantUsers'), userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error editing applicant user:', error);
    throw error;
  }
};

// Function to edit a reviewer user
export const editReviewerUser = async (userId: string, updates: Partial<ReviewerUser>): Promise<void> => {
  try {
    if (updates.email && updates.email.trim() === '') {
      throw new Error('Email cannot be empty');
    }
    if (updates.institutionalAffiliation && updates.institutionalAffiliation.trim() === '') {
      throw new Error('Institutional Affiliation cannot be empty');
    }
    const userRef = doc(collection(db, 'reviewerUsers'), userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error editing reviewer user:', error);
    throw error;
  }
};

// Function to get an applicant user
export const getApplicantUser = async (userId: string): Promise<ApplicantUser | null> => {
  try {
    const userRef = doc(collection(db, 'applicantUsers'), userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as ApplicantUser;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting applicant user:', error);
    throw error;
  }
};

// Function to get a reviewer user
export const getReviewerUser = async (userId: string): Promise<ReviewerUser | null> => {
  try {
    const userRef = doc(collection(db, 'reviewerUsers'), userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as ReviewerUser;
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
