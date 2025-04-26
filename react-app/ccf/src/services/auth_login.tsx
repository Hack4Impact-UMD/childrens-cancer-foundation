import { signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { auth, db } from "../index"
import { getDoc, doc } from "firebase/firestore";

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Successfully signed in");
    return { user: userCredential.user, error: null };
  } catch (err: any) {
    let errorMessage = "An unexpected error occurred";
    if (err.code === AuthErrorCodes.INVALID_PASSWORD || err.code === AuthErrorCodes.USER_DELETED) {
      errorMessage = "The email address or password is incorrect";
    }
    return { user: null, error: errorMessage };
  }
};

export const getRole = async () => {
  const user = auth.currentUser
  if (user) {
    return user.getIdTokenResult().then((idTokenResult) => {
      return idTokenResult.claims.role
    }).catch((error) => {
      console.log(error)
    })
  } else {
    return null
  }
}

// Gets the user claims from the idTokenResult
export const getCurrentUserClaims = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims;
  } catch (error) {
    console.error('Error fetching user claims:', error);
    throw error;
  }
};


// Uses getCurrentUserClaims to determine the collection and then gets the user data from the collection
export const getCurrentUserData = async (): Promise<UserData | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Get user claims to determine the collection
    const claims = await getCurrentUserClaims();
    const role = claims.role;

    if (!role) {
      throw new Error('User role not found');
    }

    const userDoc = await getDoc(doc(db, `${role}s`, user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};


export interface UserData {
  firstName?: string;
  lastName?: string;
  title?: string;
  affiliation?: string;
}