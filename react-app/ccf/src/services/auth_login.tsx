import { signInWithEmailAndPassword, AuthErrorCodes, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../index"
import { getDoc, doc } from "firebase/firestore";
import { UserData } from "../types/usertypes"

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Successfully signed in");
    return { user: userCredential.user, error: null };
  } catch (err: any) {
    let errorMessage = "Incorrect username or password";
    if (err.code === AuthErrorCodes.INVALID_PASSWORD || err.code === AuthErrorCodes.USER_DELETED || err.code === AuthErrorCodes.INVALID_EMAIL) {
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

    // Use the standard collection naming pattern
    const collectionName = `${role}s`;
    const userDoc = await getDoc(doc(db, collectionName, user.uid));

    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully");
    return { success: true, error: null };
  } catch (err: any) {
    let errorMessage = "An error occurred while sending the password reset email";
    if (err.code === AuthErrorCodes.INVALID_EMAIL) {
      errorMessage = "Please enter a valid email address";
    } else if (err.code === AuthErrorCodes.USER_DELETED) {
      errorMessage = "No account found with this email address";
    }
    console.error("Password reset error:", err);
    return { success: false, error: errorMessage };
  }
};