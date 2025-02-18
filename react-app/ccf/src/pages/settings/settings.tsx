import { useEffect, useState } from "react";
import "./Settings.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import "../reviewer-dashboard/ReviewerDashboard.css"
function AccountSettingsPage(): JSX.Element {
  // User information
  const [username, setUsername] = useState<string | null>("example_user");
  const [currentPassword, setCurrentPassword] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Password requirements
  const [specialChar, setSpecialChar] = useState(false);
  const [capitalLetter, setCapitalLetter] = useState(false);
  const [number, setNumber] = useState(false);
  const [showReqs, setShowReqs] = useState(false);
  const [pwdUnmatched, setPwdUnmatched] = useState(false);
  const [currentPasswordMatched, setCurrentPasswordMatched] = useState(true);

  // Personal information
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [title, setTitle] = useState("Developer");
  const [institution, setInstitution] = useState("Tech Institute");

  useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      setUsername("example_user");
      setFirstName("John");
      setLastName("Doe");
      setTitle("Professor");
      setInstitution("University of Maryland");
    }, 1000);
  }, []);

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

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!specialChar || !capitalLetter || !number || pwdUnmatched || !currentPasswordMatched) {
      console.log("Failed to submit. One requirement was not met.");
      return;
    }
    console.log("Password changed successfully:", pwd);
  };

  const sidebarItems = [
    {name: "Home", path: "/"},
    {name: "Account Settings", path: "/settings"},
    {name: "Logout", path: "/login"}
  ];

  return (
      <div>
      <Sidebar links={sidebarItems}
      />
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
              {currentPasswordMatched ? (
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
              ) : (
                <p className="validation">Current password is incorrect</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
  );
}

export default AccountSettingsPage;
