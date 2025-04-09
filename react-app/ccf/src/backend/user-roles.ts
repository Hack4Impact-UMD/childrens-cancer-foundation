import {auth} from "../index"
import { httpsCallable, getFunctions } from "firebase/functions"

export const addReviewerRole = async (email: String) => {
    const functions = getFunctions();
    const addReviewerRole = httpsCallable(functions, "addReviewerRole");
    await addReviewerRole({ email: email })
    .then((result) => {
      console.log(result.data);  // Success message from the function
    })
    .catch((error) => {
      console.log('Error: ', error);
    });
}

export const addApplicantRole = async (email: string) => {
    const functions = getFunctions();
    const addApplicantRole = httpsCallable(functions, "addApplicantRole");
    await addApplicantRole({ email: email.trim() })
    .then((result) => {
      console.log(email)
      console.log(result.data);  // Success message from the function
    })
    .catch((error) => {
      console.log('Error: ', error);
    });
}

export const addAdminRole = async (email: String) => {
    const functions = getFunctions();
    const addAdminRole = httpsCallable(functions, "addAdminRole");
    await addAdminRole({ email: email })
    .then((result) => {
      console.log(result.data);  // Success message from the function
    })
    .catch((error) => {
      console.log('Error: ', error);
    });
}