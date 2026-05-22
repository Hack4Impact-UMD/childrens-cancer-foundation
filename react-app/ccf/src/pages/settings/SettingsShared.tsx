import { ReactNode } from "react";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import { SideBarTypes } from "../../types/sidebar-types";
import TextField from "@mui/material/TextField";
import { InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface SettingsPageLayoutProps {
  sidebarItems: SideBarTypes[];
  children: ReactNode;
  title?: string;
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
  title = "Account Settings",
}: SettingsPageLayoutProps): JSX.Element {
  return (
    <RoleDashboardShell sidebarItems={sidebarItems} title={title}>
      <div className="AccountSettings-sections-content">{children}</div>
    </RoleDashboardShell>
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

      <div className="settings-field-grid">
        {fields.map((field) => (
          <TextField
            key={field.label}
            sx={{ width: field.width || "100%" }}
            label={field.label}
            variant="outlined"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        ))}

        {personalInfoError && <p className="error-message">{personalInfoError}</p>}
      </div>
      <div className="button-message-container">
        <button
          type="button"
          className="signup-btn2 settings-submit-btn"
          onClick={onSave}
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
        <h2>Change Password</h2>
      </div>

      <p className="settings-email-row">
        <span className="settings-email-label">{emailLabel}:</span>
        <span className="username-text">{email || "No email available"}</span>
      </p>

      <div className="settings-field-grid">
        <TextField
          sx={{ width: "100%" }}
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
          sx={{ width: "100%" }}
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

        <TextField
          sx={{ width: "100%" }}
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
      </div>

      {showReqs && (
        <div className="pwd-reqs">
          <p>Password requires:</p>
          <label className="checkbox">
            <input type="checkbox" name="options" value="Yes" checked={specialChar} readOnly />
            One special character
          </label>
          <label className="checkbox">
            <input type="checkbox" name="options" value="Yes" checked={capitalLetter} readOnly />
            One capital letter
          </label>
          <label className="checkbox">
            <input type="checkbox" name="options" value="Yes" checked={number} readOnly />
            One number
          </label>
        </div>
      )}

      {(!specialChar || !number || !capitalLetter) && pwd && !showReqs && (
        <p className="validation">At least one password requirement was not met</p>
      )}

      {updateError && <p className="error-message">{updateError}</p>}

      <div className="button-message-container">
        <button
          type="submit"
          className={`${canSubmit ? "signup-btn2" : "disable-submit"} settings-submit-btn`}
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          Change Password
        </button>
        {updateSuccess && (
          <p className="success-message inline-message">
            Password updated successfully!
          </p>
        )}
      </div>
    </div>
  );
}
