
import { useEffect, useState } from "react";
import "./Settings.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import "../reviewer-dashboard/ReviewerDashboard.css"
import { getSidebarbyRole} from "../../types/sidebar-types";
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { getCurrentUserData, getCurrentUserClaims } from "../../services/auth_login";
import { auth } from "../../index";

function AccountSettingsPage(): JSX.Element {
  const sidebarItems = getSidebarbyRole('applicant');
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

  // Personal information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");

  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [personalInfoSuccess, setPersonalInfoSuccess] = useState(false);
  const [personalInfoError, setPersonalInfoError] = useState<string | null>(null);

  // To store the user collection name to use in saving personal information
  const [userCollectionName, setUserCollectionName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUsername(user.email || "No email available");

          // Get user data
          const userData = await getCurrentUserData();
          if (userData) {
            setFirstName(userData.firstName || "");
            setLastName(userData.lastName || "");
            setTitle(userData.title || "");
            setInstitution(userData.affiliation || "");
          }

          // Get user claims
          const claims = await getCurrentUserClaims();
          if (typeof claims.role === 'string') {
            setUserCollectionName(claims.role);
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
      const db = getFirestore();
      const userRef = doc(db, `${userCollectionName}s`, user.uid);
      
      await updateDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
        title: title,
        affiliation: institution
      });

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
  
  return (
      <div>
      <Sidebar links={sidebarItems} />
    <div className="dashboard-container">

      <div className="AccountSettings">
        <div className="AccountSettings-header-container">
          <img src={logo} className="AccountSettings-logo" alt="logo" />
          <h1 className="AccountSettings-header">Account Settings</h1>
        </div>

        <div className="AccountSettings-sections-content">
          <div className="AccountSettings-section">
            <div className="header-title">
              <h2>Personal Information</h2>
            </div>

            <div className="AccountSetting-personal-info">
              <div className="AccountSetting-personal-info-field">
                <label>First Name</label>
                <div className="info-row">
                  <input
                    type="text"
                    className="personal-input-text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <span className="edit-icon">✎</span>
                </div>
              </div>
              <div className="AccountSetting-personal-info-field">
                <label>Last Name</label>
                <div className="info-row">
                  <input
                    type="text"
                    className="personal-input-text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <span className="edit-icon">✎</span>
                </div>
              </div>
              <div className="AccountSetting-personal-info-field">
                <label>Title</label>
                <div className="info-row">
                  <input
                    type="text"
                    className="personal-input-text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <span className="edit-icon">✎</span>
                </div>
              </div>
              <div className="AccountSetting-personal-info-field">
                <label>Institution</label>
                <div className="info-row">
                  <input
                    type="text"
                    className="personal-input-text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                  />
                  <span className="edit-icon">✎</span>
                </div>
              </div>
              {personalInfoError && (
                <p className="error-message">{personalInfoError}</p>
              )}
            </div>
            <div className="button-container">
              <div className="button-message-container">
                <button
                  type="button"
                  className="signup-btn2"
                  onClick={handlePersonalInfoSubmit}
                  style={{ width: "200px" }}
                >
                  Save Personal Information
                </button>
                {personalInfoSuccess && (
                  <p className="success-message inline-message">Personal information updated successfully!</p>
                )}
              </div>
            </div>
          </div>

          <div className="AccountSettings-section">
            <div className="header-title">
              <h2>Account Settings</h2>
            </div>
            <div className="info-row-settings">
              <label>Username</label>
              <span className="username-text">
                {username ? username : "No username available"}
              </span>
            </div>
            <div className="info-row-settings">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onFocus={() => setShowReqs(true)}
                onBlur={() => setShowReqs(false)}
                onKeyUp={checkConfirmPwd}
                className="account-input-text"
              />
            </div>
            <div className="info-row-settings">
              <label>New Password</label>
              <div className="info-row">
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={pwd}
                  onChange={(e) => {
                    setPwd(e.target.value);
                    const newRequirements = checkPasswordRequirements(e.target.value);
                    setSpecialChar(newRequirements.specialChar);
                    setCapitalLetter(newRequirements.capitalLetter);
                    setNumber(newRequirements.number);
                  }}
                  onFocus={() => setShowReqs(true)}
                  onBlur={() => setShowReqs(false)}
                  onKeyUp={checkConfirmPwd}
                  className="account-input-text"
                />
              </div>
              {showReqs && (
                <div className="pwd-reqs">
                  <p>Password requires:</p>
                  <label id="checkbox">
                    <input
                      type="checkbox"
                      name="options"
                      value="Yes"
                      checked={specialChar}
                      readOnly
                    />
                    One special character
                  </label>
                  <label id="checkbox">
                    <input
                      type="checkbox"
                      name="options"
                      value="Yes"
                      checked={capitalLetter}
                      readOnly
                    />
                    One capital letter
                  </label>
                  <label id="checkbox">
                    <input
                      type="checkbox"
                      name="options"
                      value="Yes"
                      checked={number}
                      readOnly
                    />
                    One number
                  </label>
                </div>
              )}

              {(!specialChar || !number || !capitalLetter) && pwd && !showReqs && (
                <p className="validation">
                  At least one password requirement was not met
                </p>
              )}

              <label>Confirm Password</label>
              <div
                className={
                  !pwdUnmatched
                    ? "confirm-pwd-container"
                    : "confirm-pwd-container-exclaim"
                }
              >
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  onKeyUp={checkConfirmPwd}
                  className="account-input-text"
                />
                {pwdUnmatched && <p id="exclaim">!</p>}
              </div>

              {pwdUnmatched && (
                <p className="validation">Passwords do not match</p>
              )}
              {updateError && (
                <p className="error-message">{updateError}</p>
              )}
              {updateSuccess && (
                <p className="success-message">Password updated successfully!</p>
              )}
              <button
                type="submit"
                className={
                  !pwd ||
                  (pwd && !confirmPwd) ||
                  !specialChar ||
                  !capitalLetter ||
                  !number ||
                  pwdUnmatched
                    ? "disable-submit"
                    : "signup-btn2"
                }
                onClick={handleSubmit}
                disabled={
                  !firstName ||
                  !lastName ||
                  !pwd ||
                  (pwd && !confirmPwd) ||
                  !specialChar ||
                  !capitalLetter ||
                  !number ||
                  pwdUnmatched
                }
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
  );
}

export default AccountSettingsPage;
