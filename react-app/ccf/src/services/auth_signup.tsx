import { AuthErrorCodes, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../index"

type InputState = {
  email: string;
  password: string;
  confirmPassword: string;
};

export const handleSignup = (
  input: InputState,
  setError: (message: string | null) => void
) => {
  const email = input.email.toLowerCase().trim();
  const password = input.password;

  if (password !== input.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log(userCredential.user);
      sendEmailVerification(userCredential.user)
        .then(() => {
          console.log("Verification email sent.");
        })
        .catch((err) => {
          console.error("Error sending verification email:", err);
        });
      console.log("Successfully signed up");
    })
    .catch((err) => {
      if (err.code === AuthErrorCodes.WEAK_PASSWORD) {
        setError("The password is too weak.");
      } else if (err.code === AuthErrorCodes.EMAIL_EXISTS) {
        setError("The email address is already in use.");
      } else {
        console.log(err.code);
        alert(err.code);
      }
    });
};