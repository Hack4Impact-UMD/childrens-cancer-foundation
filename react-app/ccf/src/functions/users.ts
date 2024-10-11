import { firestore } from '../index';
import { collection, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

// ApplicantUser interface
interface ApplicantUser {
  userId: string;
  name: string;
  title: string;
  email: string;
  institutionalAffiliation: string;
  principalInvestigator: string;
  applyingFor: string;
  receivedPriorCCFFunding: boolean;
}

// ReviewerUser interface
interface ReviewerUser {
  userId: string;
  name: string;
  email: string;
  institutionalAffiliation: string;
}

// Function to add a new applicant user
export const addApplicantUser = async (user: ApplicantUser): Promise<void> => {
  try {
    const userRef = doc(collection(firestore, 'applicantUsers'), user.userId);
    await setDoc(userRef, user);
  } catch (error) {
    console.error('Error adding applicant user:', error);
    throw error;
  }
};

// Function to add a new reviewer user
export const addReviewerUser = async (user: ReviewerUser): Promise<void> => {
  try {
    const userRef = doc(collection(firestore, 'reviewerUsers'), user.userId);
    await setDoc(userRef, user);
  } catch (error) {
    console.error('Error adding reviewer user:', error);
    throw error;
  }
};

// Function to delete an applicant user
export const deleteApplicantUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(collection(firestore, 'applicantUsers'), userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting applicant user:', error);
    throw error;
  }
};

// Function to delete a reviewer user
export const deleteReviewerUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(collection(firestore, 'reviewerUsers'), userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting reviewer user:', error);
    throw error;
  }
};

// Function to edit an applicant user
export const editApplicantUser = async (userId: string, updates: Partial<ApplicantUser>): Promise<void> => {
  try {
    const userRef = doc(collection(firestore, 'applicantUsers'), userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error editing applicant user:', error);
    throw error;
  }
};

// Function to edit a reviewer user
export const editReviewerUser = async (userId: string, updates: Partial<ReviewerUser>): Promise<void> => {
  try {
    const userRef = doc(collection(firestore, 'reviewerUsers'), userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error editing reviewer user:', error);
    throw error;
  }
};

// Function to get an applicant user
export const getApplicantUser = async (userId: string): Promise<ApplicantUser | null> => {
  try {
    const userRef = doc(collection(firestore, 'applicantUsers'), userId);
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
    const userRef = doc(collection(firestore, 'reviewerUsers'), userId);
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