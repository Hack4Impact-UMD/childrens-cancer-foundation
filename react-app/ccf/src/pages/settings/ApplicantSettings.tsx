
import { useEffect, useState } from "react";
import "./Settings.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import "../reviewer-dashboard/ReviewerDashboard.css"
import { getSidebarbyRole } from "../../types/sidebar-types";
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { getCurrentUserData, getCurrentUserClaims } from "../../services/auth_login";
import { auth, db } from "../../index";
import TextField from '@mui/material/TextField';
import { InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { editApplicantUser } from "../../users/usermanager";

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

      editApplicantUser(user.uid, {
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
                <TextField
                  sx={{
                    width: '30%'
                  }}
                  label="First Name"
                  variant="outlined"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />

                <TextField
                  sx={{
                    width: '30%'
                  }}
                  label="Last Name"
                  variant="outlined"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)} />

                <TextField
                  sx={{
                    width: '30%'
                  }}
                  label="Title"
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)} />

                <TextField
                  sx={{
                    width: '30%'
                  }}
                  label="Institution"
                  variant="outlined"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)} />

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

                <TextField
                  sx={{
                    width: '40%'
                  }}
                  label="Current Password"
                  placeholder="Enter current password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  variant="outlined"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onKeyUp={checkConfirmPwd}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowCurrentPassword}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }} />

                <TextField
                  sx={{
                    width: '40%'
                  }}
                  label="New Password"
                  placeholder="Enter new password"
                  type={showNewPassword ? 'text' : 'password'}
                  variant="outlined"
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
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowNewPassword}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }} />

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

                <TextField
                  sx={{
                    width: '40%'
                  }}
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  variant="outlined"
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  onKeyUp={checkConfirmPwd}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowConfirmPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  error={pwdUnmatched}
                  helperText={pwdUnmatched && 'Passwords do not match'}
                />

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
