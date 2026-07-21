import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CreateAccount.css";
import logo from "../../assets/ccf-logo.png";
import DrHanleyLabImage from "../../assets/Dr. Hanley Lab 1.png";
import toretsky from "../../assets/toretskywithpatient 1.png";
import yellowOverlay from "../../assets/yellowoverlay.png";
import { UserData } from "../../types/usertypes";
import {
  VALID_INSTITUTIONS,
  validateInstitution,
  checkEmailCreateAcc,
  checkPasswordRequirements,
} from "../../utils/validation";

export interface CreateAccountFormProps {
  role: "applicant" | "reviewer";
  /** Creates the account (auth + db). Throw to signal failure. */
  onSubmit: (userData: UserData, password: string) => Promise<void>;
  /** Maps an error thrown by onSubmit to a user-facing message. */
  mapSubmitError?: (error: unknown) => string;
}

// The full form is split across this many steps so each screen stays short.
// Each step's fields are the matching `step === n` block in the render below.
const TOTAL_STEPS = 2;

const DEFAULT_ERROR =
  "Something went wrong while creating your account. Please try again.";

function CreateAccountForm({
  role,
  onSubmit,
  mapSubmitError,
}: CreateAccountFormProps): JSX.Element {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [showReqs, setShowReqs] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Derived validation (recomputed each render — no duplicated flag state).
  const reqs = checkPasswordRequirements(pwd);
  const pwdReqsMet =
    reqs.specialChar && reqs.capitalLetter && reqs.number && reqs.minLength;
  const emailValid = checkEmailCreateAcc(email);
  const pwdMatch = confirmPwd === "" || confirmPwd === pwd;

  const step1Valid =
    !!firstName.trim() && !!lastName.trim() && validateInstitution(affiliation);
  const step2Valid =
    emailValid && pwdReqsMet && confirmPwd !== "" && pwd === confirmPwd;

  const primaryDisabled =
    step === 1 ? !step1Valid : !step2Valid || submitting;

  const goBack = () => {
    setSubmitError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinalSubmit = async () => {
    if (!step1Valid || !step2Valid || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const userData: UserData = {
        email,
        firstName,
        lastName,
        affiliation,
        title,
        role,
      };
      await onSubmit(userData, pwd);
      navigate("/Login");
    } catch (e) {
      setSubmitError(mapSubmitError ? mapSubmitError(e) : DEFAULT_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  // Enter key / form submit: advance to the next step, or create on the last.
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < TOTAL_STEPS) {
      if (step1Valid) setStep((s) => s + 1);
    } else {
      handleFinalSubmit();
    }
  };

  return (
    <div className="login-container createAcc-page">
      <div className="login-content">
        <div className="login-form">
          <div className="header-container2">
            <img
              src={logo}
              className="logo2"
              alt="Circular logo with red borders encompassing 'The children's cancer Foundation, Inc.' and three individuals in the middle"
            />
            <h1 className="global-header">Create Account</h1>
          </div>

          <div className="createAcc-stepper" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span
                    className={`createAcc-step-line ${step > i ? "done" : ""}`}
                  />
                )}
                <span
                  className={`createAcc-step-dot ${
                    step === i + 1 ? "active" : ""
                  } ${step > i + 1 ? "done" : ""}`}
                >
                  {i + 1}
                </span>
              </React.Fragment>
            ))}
          </div>

          <form className="form-container2" onSubmit={handleFormSubmit}>
            {step === 1 && (
              <>
                <div className="name-container">
                  <div>
                    <label>First Name*</label>
                    <input
                      type="text"
                      placeholder="Enter your first name"
                      id="firstName"
                      className="input"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="lastName-container">
                    <label>Last Name*</label>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      id="lastName"
                      className="input"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <label>Title</label>
                <input
                  type="text"
                  placeholder="M.D., Ph.D., etc."
                  id="title"
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <label htmlFor="affiliation">
                  Institution/Hospital Affiliation*
                </label>
                <select
                  id="affiliation"
                  className="input"
                  required
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                >
                  <option value="">Select an institution</option>
                  {VALID_INSTITUTIONS.map((institution) => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
              </>
            )}

            {step === 2 && (
              <>
                <label>Email*</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSubmitError(null);
                  }}
                />
                {email.length > 0 && !emailValid && (
                  <p className="validation">Please enter a valid email address</p>
                )}

                <label>Password*</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  className="input"
                  required
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  onFocus={() => setShowReqs(true)}
                  onBlur={() => setShowReqs(false)}
                />

                {showReqs && (
                  <div className="pwd-reqs">
                    <p>Password requires:</p>
                    <label className="checkbox">
                      <input type="checkbox" checked={reqs.minLength} readOnly />
                      More than 6 characters
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" checked={reqs.specialChar} readOnly />
                      One special character
                    </label>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={reqs.capitalLetter}
                        readOnly
                      />
                      One capital letter
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" checked={reqs.number} readOnly />
                      One number
                    </label>
                  </div>
                )}
                {!pwdReqsMet && pwd && !showReqs && (
                  <p className="validation">
                    At least one password requirement was not met
                  </p>
                )}

                <label>Confirm Password*</label>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="input"
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
                {!pwdMatch && (
                  <p className="validation">Passwords do not match</p>
                )}

                {submitError && <p className="validation">{submitError}</p>}
              </>
            )}

            <button
              type="submit"
              className={primaryDisabled ? "disable-submit" : "signup-btn2"}
              disabled={primaryDisabled}
            >
              {step < TOTAL_STEPS
                ? "Next"
                : submitting
                ? "Creating account…"
                : "Sign Up"}
            </button>

            {step > 1 && (
              <button
                type="button"
                className="createAcc-back-btn"
                onClick={goBack}
              >
                &larr; Back
              </button>
            )}

            <p className="acc-req2">
              Already have an account?{" "}
              <Link to="/login" className="acc-req2" id="link-to">
                <b>Log in</b>
              </Link>
            </p>
          </form>
        </div>

        <div className="login-imageContainer">
          <div className="createAccApplicant-stackedImages">
            <img
              src={DrHanleyLabImage}
              aria-hidden="true"
              alt="Lab research"
              className="createAccApplicant-researchImage"
            />
            <img
              src={toretsky}
              aria-hidden="true"
              alt="Doctor with patient"
              className="createAccApplicant-researchImage"
            />
          </div>
          <div className="createAccApplicant-yellowOverlay">
            <img
              src={yellowOverlay}
              alt=""
              aria-hidden="true"
              className="createAccApplicant-overlayImage"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountForm;
