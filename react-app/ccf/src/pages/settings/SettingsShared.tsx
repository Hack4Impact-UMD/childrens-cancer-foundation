import { ReactNode } from "react";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { SideBarTypes } from "../../types/sidebar-types";
import TextField from "@mui/material/TextField";
import { InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface SettingsPageLayoutProps {
  sidebarItems: SideBarTypes[];
  children: ReactNode;
}

interface PersonalInfoField {
  label: string;
  value: string;
  onChange: (value: string) => void;
  width?: string;
}

interface PersonalInformationSectionProps {
  fields: PersonalInfoField[];
  personalInfoError: string | null;
  personalInfoSuccess: boolean;
  onSave: (e: React.FormEvent) => Promise<void>;
}

interface PasswordSettingsSectionProps {
  email: string | null;
  currentPassword: string;
  pwd: string;
  confirmPwd: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  specialChar: boolean;
  capitalLetter: boolean;
  number: boolean;
  showReqs: boolean;
  updateError: string | null;
  updateSuccess: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onPwdChange: (value: string) => void;
  onConfirmPwdChange: (value: string) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onFocusPwd: () => void;
  onBlurPwd: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  emailLabel?: string;
}

export function SettingsPageLayout({
  sidebarItems,
  children,
}: SettingsPageLayoutProps): JSX.Element {
  return (
    <div>
      <Sidebar links={sidebarItems} />
      <div className="dashboard-container">
        <div className="AccountSettings">
          <div className="AccountSettings-header-container">
            <img src={logo} className="AccountSettings-logo" alt="logo" />
            <h1 className="AccountSettings-header">Account Settings</h1>
          </div>
          <div className="AccountSettings-sections-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PersonalInformationSection({
  fields,
  personalInfoError,
  personalInfoSuccess,
  onSave,
}: PersonalInformationSectionProps): JSX.Element {
  return (
    <div className="AccountSettings-section">
      <div className="header-title">
        <h2>Personal Information</h2>
      </div>

      <div className="AccountSetting-personal-info">
        {fields.map((field) => (
          <TextField
            key={field.label}
            sx={{ width: field.width || "30%" }}
            label={field.label}
            variant="outlined"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        ))}

        {personalInfoError && <p className="error-message">{personalInfoError}</p>}
      </div>
      <div className="button-container">
        <div className="button-message-container">
          <button
            type="button"
            className="signup-btn2"
            onClick={onSave}
            style={{ width: "200px" }}
          >
            Save Personal Information
          </button>
          {personalInfoSuccess && (
            <p className="success-message inline-message">
              Personal information updated successfully!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PasswordSettingsSection({
  email,
  currentPassword,
  pwd,
  confirmPwd,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  specialChar,
  capitalLetter,
  number,
  showReqs,
  updateError,
  updateSuccess,
  onCurrentPasswordChange,
  onPwdChange,
  onConfirmPwdChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onFocusPwd,
  onBlurPwd,
  onSubmit,
  emailLabel = "Email",
}: PasswordSettingsSectionProps): JSX.Element {
  const pwdMismatch = pwd !== confirmPwd;
  const showPwdMismatch = confirmPwd.length > 0 && pwdMismatch;
  const canSubmit =
    !!pwd && !!confirmPwd && specialChar && capitalLetter && number && !pwdMismatch;

  return (
    <div className="AccountSettings-section">
      <div className="header-title">
        <h2>Account Settings</h2>
      </div>
      <div className="info-row-settings">
        <label>{emailLabel}</label>
        <span className="username-text">{email || "No email available"}</span>

        <TextField
          sx={{ width: "40%" }}
          label="Current Password"
          placeholder="Enter current password"
          type={showCurrentPassword ? "text" : "password"}
          variant="outlined"
          required
          value={currentPassword}
          onChange={(e) => onCurrentPasswordChange(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={onToggleCurrentPassword}
                  edge="end"
                >
                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          sx={{ width: "40%" }}
          label="New Password"
          placeholder="Enter new password"
          type={showNewPassword ? "text" : "password"}
          variant="outlined"
          required
          value={pwd}
          onChange={(e) => onPwdChange(e.target.value)}
          onFocus={onFocusPwd}
          onBlur={onBlurPwd}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={onToggleNewPassword}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {showReqs && (
          <div className="pwd-reqs">
            <p>Password requires:</p>
            <label id="checkbox">
              <input type="checkbox" name="options" value="Yes" checked={specialChar} readOnly />
              One special character
            </label>
            <label id="checkbox">
              <input type="checkbox" name="options" value="Yes" checked={capitalLetter} readOnly />
              One capital letter
            </label>
            <label id="checkbox">
              <input type="checkbox" name="options" value="Yes" checked={number} readOnly />
              One number
            </label>
          </div>
        )}

        {(!specialChar || !number || !capitalLetter) && pwd && !showReqs && (
          <p className="validation">At least one password requirement was not met</p>
        )}

        <TextField
          sx={{ width: "40%" }}
          label="Confirm New Password"
          placeholder="Confirm new password"
          type={showConfirmPassword ? "text" : "password"}
          variant="outlined"
          required
          value={confirmPwd}
          onChange={(e) => onConfirmPwdChange(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={onToggleConfirmPassword}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          error={showPwdMismatch}
          helperText={showPwdMismatch && "Passwords do not match"}
        />

        {updateError && <p className="error-message">{updateError}</p>}
        {updateSuccess && <p className="success-message">Password updated successfully!</p>}
        <button
          type="submit"
          className={canSubmit ? "signup-btn2" : "disable-submit"}
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          Change Password
        </button>
      </div>
    </div>
  );
}
