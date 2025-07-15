import { auth } from '../index';
import { sendEmailVerification } from 'firebase/auth';

export const getUrlParam = (name: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};

export const isEmailVerified = (): boolean => {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
};

export const getCurrentUserEmailStatus = () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    email: user.email,
    emailVerified: user.emailVerified,
    uid: user.uid
  };
};

export const resendEmailVerification = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, message: 'No user signed in' };
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email already verified' };
    }

    await sendEmailVerification(user);
    return { success: true, message: 'Verification email sent' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, message: 'Failed to send email' };
  }
}; 