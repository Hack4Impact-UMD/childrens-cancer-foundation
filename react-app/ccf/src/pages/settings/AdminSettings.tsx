
import { useEffect, useState } from "react";
import "./Settings.css";
import "../reviewer-dashboard/ReviewerDashboard.css"
import { getSidebarbyRole } from "../../types/sidebar-types";
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { auth } from "../../index";
import { PasswordSettingsSection, SettingsPageLayout } from "./SettingsShared";

function AccountSettingsPage(): JSX.Element {
  const sidebarItems = getSidebarbyRole('admin');
  // User information
  const [username, setUsername] = useState<string | null>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Password requirements
  const [specialChar, setSpecialChar] = useState(false);
  const [capitalLetter, setCapitalLetter] = useState(false);
  const [number, setNumber] = useState(false);
  const [showReqs, setShowReqs] = useState(false);
  const [pwdUnmatched, setPwdUnmatched] = useState(false);

  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const navigate = useNavigate();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUsername(user.email || "No email available");

        } else {
          console.log("User is not authenticated");
          navigate('/login');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const checkPasswordRequirements = (password: string) => {
    return {
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      capitalLetter: /[A-Z]/.test(password),
      number: /\d/.test(password),
    };
  };

  const checkConfirmPwd = () => {
    if (confirmPwd !== "") {
      confirmPwd === pwd ? setPwdUnmatched(false) : setPwdUnmatched(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);

    if (!specialChar || !capitalLetter || !number || pwdUnmatched) {
      console.log("Failed to submit. One requirement was not met.");
      return;
    }

    const user = auth.currentUser;

    if (!user || !user.email) {
      setUpdateError("No user is currently signed in");
      return;
    }

    try {
      // First reauthenticate with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // If reauthentication successful, update password
      await updatePassword(user, pwd);

      // Clear form and show success message
      setCurrentPassword("");
      setPwd("");
      setConfirmPwd("");
      setUpdateSuccess(true);

      console.log("Password updated successfully");
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        setUpdateError("Current password is incorrect");
      } else {
        setUpdateError(error.message || "Failed to update password");
      }
    }
  }

  const handlePasswordChange = (value: string) => {
    setPwd(value);
    const newRequirements = checkPasswordRequirements(value);
    setSpecialChar(newRequirements.specialChar);
    setCapitalLetter(newRequirements.capitalLetter);
    setNumber(newRequirements.number);
  };

  return (
    <SettingsPageLayout sidebarItems={sidebarItems}>
      <PasswordSettingsSection
        username={username}
        currentPassword={currentPassword}
        pwd={pwd}
        confirmPwd={confirmPwd}
        showCurrentPassword={showCurrentPassword}
        showNewPassword={showNewPassword}
        showConfirmPassword={showConfirmPassword}
        specialChar={specialChar}
        capitalLetter={capitalLetter}
        number={number}
        showReqs={showReqs}
        pwdUnmatched={pwdUnmatched}
        updateError={updateError}
        updateSuccess={updateSuccess}
        onCurrentPasswordChange={setCurrentPassword}
        onPwdChange={handlePasswordChange}
        onConfirmPwdChange={setConfirmPwd}
        onToggleCurrentPassword={handleClickShowCurrentPassword}
        onToggleNewPassword={handleClickShowNewPassword}
        onToggleConfirmPassword={handleClickShowConfirmPassword}
        onFocusPwd={() => setShowReqs(true)}
        onBlurPwd={() => setShowReqs(false)}
        onConfirmPwdCheck={checkConfirmPwd}
        onSubmit={handleSubmit}
        usernameLabel="Email"
      />
    </SettingsPageLayout>
  );
}

export default AccountSettingsPage;
