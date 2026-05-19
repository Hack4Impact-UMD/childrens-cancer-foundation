
import { useEffect, useState } from "react";
import "./Settings.css";
import "../reviewer-dashboard/ReviewerDashboard.css"
import { getSidebarbyRole, getApplicantSidebarItems, SideBarTypes } from "../../types/sidebar-types";
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { getCurrentUserData } from "../../services/auth_login";
import { auth } from "../../index";
import { editApplicantUser } from "../../users/usermanager";
import {
  PasswordSettingsSection,
  PersonalInformationSection,
  SettingsPageLayout,
} from "./SettingsShared";

function AccountSettingsPage(): JSX.Element {
  const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(getSidebarbyRole('applicant'));
  // User information
  const [email, setEmail] = useState<string | null>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Password requirements
  const [specialChar, setSpecialChar] = useState(false);
  const [capitalLetter, setCapitalLetter] = useState(false);
  const [number, setNumber] = useState(false);
  const [showReqs, setShowReqs] = useState(false);

  // Personal information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");

  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [personalInfoSuccess, setPersonalInfoSuccess] = useState(false);
  const [personalInfoError, setPersonalInfoError] = useState<string | null>(null);

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
    // Fetch dynamic sidebar items
    getApplicantSidebarItems().then((items) => {
      setSidebarItems(items);
    }).catch((e) => {
      console.error('Error loading sidebar items:', e);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setEmail(user.email || "No email available");

          // Get user data
          const userData = await getCurrentUserData();
          if (userData) {
            setFirstName(userData.firstName || "");
            setLastName(userData.lastName || "");
            setTitle(userData.title || "");
            setInstitution(userData.affiliation || "");
          }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);
    const pwdMismatch = pwd !== confirmPwd;

    if (!specialChar || !capitalLetter || !number || pwdMismatch) {
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
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalInfoError(null);
    setPersonalInfoSuccess(false);

    const user = auth.currentUser;

    if (!user) {
      setPersonalInfoError("No user is currently signed in");
      return;
    }

    try {
      await editApplicantUser(user.uid, {
        firstName: firstName,
        lastName: lastName,
        title: title,
        affiliation: institution
      })

      setPersonalInfoSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPersonalInfoSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error("Error updating personal information:", error);
      setPersonalInfoError(error.message || "Failed to update personal information");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPwd(value);
    const newRequirements = checkPasswordRequirements(value);
    setSpecialChar(newRequirements.specialChar);
    setCapitalLetter(newRequirements.capitalLetter);
    setNumber(newRequirements.number);
  };

  return (
    <SettingsPageLayout sidebarItems={sidebarItems}>
      <PersonalInformationSection
        fields={[
          { label: "First Name", value: firstName, onChange: setFirstName },
          { label: "Last Name", value: lastName, onChange: setLastName },
          { label: "Title", value: title, onChange: setTitle },
          { label: "Institution", value: institution, onChange: setInstitution },
        ]}
        personalInfoError={personalInfoError}
        personalInfoSuccess={personalInfoSuccess}
        onSave={handlePersonalInfoSubmit}
      />

      <PasswordSettingsSection
        email={email}
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
        onSubmit={handleSubmit}
      />
    </SettingsPageLayout>
  );
}

export default AccountSettingsPage;
