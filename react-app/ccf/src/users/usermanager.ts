import { db, auth, functions } from '../index';
import { collection, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { UserData } from '../types/usertypes';
import { createUserWithEmailAndPassword, deleteUser} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

// Function to add a new applicant user
export const addApplicantUser = async (userData: UserData, password: string): Promise<void> => {
  var user : any = null
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      password
    );
    const addApplicantRole = httpsCallable(functions, "addApplicantRole");
    user = userCredential.user;
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
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      password
    );
    const addReviewerRole = httpsCallable(functions, "addReviewerRole");
    const user = userCredential.user;
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
    var userId = userId.toLowerCase().trim();
    if (updates.email && updates.email.trim() === '') {
      throw new Error('Email cannot be empty');
    }
    if (updates.title && updates.title.trim() === '') {
      throw new Error('Title cannot be empty');
    }
    if (updates.affiliation && updates.affiliation.trim() === '') {
      throw new Error('Institutional Affiliation cannot be empty');
    }
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
    var userId = userId.toLowerCase().trim();
    if (updates.email && updates.email.trim() === '') {
      throw new Error('Email cannot be empty');
    }
    if (updates.affiliation && updates.affiliation.trim() === '') {
      throw new Error('Institutional Affiliation cannot be empty');
    }
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
    var userId = userId.toLowerCase().trim();
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
    var userId = userId.toLowerCase().trim();
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