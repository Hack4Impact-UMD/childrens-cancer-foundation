import { Link, useNavigate } from "react-router-dom";
import "./CreateAccReviewer.css";
import logo from '../../assets/ccf-logo.png';
import { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import {collection, query, where, getDocs } from "firebase/firestore";
import { VALID_INSTITUTIONS, validateInstitution } from "../../utils/validation";
import { addReviewerUser } from "../../users/usermanager";
import {UserData} from "../../types/usertypes"
import { db, storage } from "../../index"
import { ref, getDownloadURL } from "firebase/storage";

function AccountPageReviewers(): JSX.Element {
  //form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [affiliation, setAffiliation] = useState("");

  const [hanleyImage, setHanleyImage] = useState<string | undefined>(undefined);
  const [toretskyImage, setToretskyImage] = useState<string | undefined>(undefined);
  const [yellowOverlay, setYellowOverlay] = useState<string | undefined>(undefined);

  //password reqs
  const [specialChar, setSpecialChar] = useState(false);
  const [capitalLetter, setCapitalLetter] = useState(false);
  const [number, setNumber] = useState(false);
  const [showReqs, setShowReqs] = useState(false);
  const [pwdUnmatched, setPwdUnmatched] = useState(false);

  //email req
  const [emailError, setEmailError] = useState(false);
  const [emailWhitelistError, setEmailWhitelistError] = useState(false);

  const [institutionError, setInstitutionError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadImages = async () => {
      try {
        const hanleyRef = ref(storage, '/images/hanley.png');
        const toretskyRef = ref(storage, '/images/toretsky.png');
        const yellowRef = ref(storage, '/images/yellow-background.png');

        const [hanleyUrl, toretskyUrl, yellowUrl] = await Promise.all([
          getDownloadURL(hanleyRef),
          getDownloadURL(toretskyRef),
          getDownloadURL(yellowRef)
        ]);

        setHanleyImage(hanleyUrl);
        setToretskyImage(toretskyUrl);
        setYellowOverlay(yellowUrl);

        console.log(hanleyUrl);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    loadImages();
  }, []);

  useEffect(() => {}, [
    firstName,
    lastName,
    title,
    email,
    pwd,
    confirmPwd,
    affiliation,
    pwdUnmatched,
  ]);

  /* Check if user input satisfies password requirements */
  const checkPasswordRequirements = (password: string) => {
    setSpecialChar(/[\W_]/.test(password)); // Checks for special character
    setCapitalLetter(/[A-Z]/.test(password)); // Checks for capital letter
    setNumber(/[0-9]/.test(password)); // Checks for number
  };

  const checkEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|edu|org)$/i;
    if (!emailRegex.test(email)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const checkEmailWhitelist = async (email: string) => {
    if (!email) return false;

    try {
      const whitelistRef = collection(db, "reviewer-whitelist");
      const q = query(whitelistRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking whitelist:", error);
      return false;
    }
  };

  const handleSubmit = async (e: any) => {
    // don't let user submit if pwd reqs aren't met
    e.preventDefault();

    // Check whitelist before proceeding
    if (!emailError && email) {
      const isWhitelisted = await checkEmailWhitelist(email);
      if (!isWhitelisted) {
        setEmailWhitelistError(true);
        return;
      }
    }

    const functions = getFunctions();
    console.log(specialChar, capitalLetter, number, showReqs, pwdUnmatched);

    if (!specialChar || !capitalLetter || !number || pwdUnmatched) {
      console.log("Failed to submit. One requirement was not met.");
      return;
    }

    try {
      // Clear any previous whitelist error
      setEmailWhitelistError(false);

      const userData: UserData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        affiliation: affiliation,
        title: title,
        role: "reviewer"
      };

      // Use the addReviewerUser function that handles both authentication and database operations
      await addReviewerUser(userData, pwd);
      navigate("/");
    } catch (e) {
      console.log(e);
    }
  };

  const checkConfirmPwd = () => {
    if (confirmPwd !== "") {
      confirmPwd === pwd ? setPwdUnmatched(false) : setPwdUnmatched(true);
    }
  };

  return (
      <div>
        <div className="box2">
          <div className="left-container2">
            <div className="content2">
              <div className="header-container2">
                <img
                    src={logo}
                    className="logo2"
                    alt="Circular logo with red borders encompassing 'The children's cancer Foundation, Inc.' and three individuals in the middle"
                />
                <h1 className="header2">Create Account</h1>
              </div>

              <form className="form-container2">
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                />

                <label>Email*</label>
                <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      checkEmail(e.target.value);
                    }}
                    className="input"
                />

                {emailError && (
                    <p className="validation">Please enter a valid email address</p>
                )}

                {emailWhitelistError && (
                    <p className="validation">Email does not have permission to create reviewer account. Please contact CCF if you believe this to be a mistake.</p>
                )}

                <label>Password*</label>
                <input
                    type="password"
                    placeholder="Create a password"
                    required
                    value={pwd}
                    onChange={(e) => {
                      setPwd(e.target.value);
                      checkPasswordRequirements(e.target.value);
                    }}
                    onFocus={() => setShowReqs(true)} // Show on focus
                    onBlur={() => setShowReqs(false)}
                    onKeyUp={checkConfirmPwd}
                    className="input"
                />

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

                {((!specialChar || !number || !capitalLetter) && pwd && !showReqs) &&  (
                    <p className="validation">At least one password requirement was not met</p>
                )}

                <label>Confirm Password*</label>
                <input
                    type="password"
                    placeholder="Enter password again"
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    onKeyUp={checkConfirmPwd}
                    className="input"
                />
                {pwdUnmatched && <p className="validation">Passwords do not match</p>}

                {pwdUnmatched && (
                    <p className="validation">Passwords do not match</p>
                )}

                <label>Institution/Hospital Affiliation*</label>
                <select
                    value={affiliation}
                    onChange={(e) => {
                      setAffiliation(e.target.value);
                      setInstitutionError(!validateInstitution(e.target.value));
                    }}
                    required
                    className="input"
                >
                  <option value="">Select an institution</option>
                  {VALID_INSTITUTIONS.map((institution) => (
                      <option key={institution} value={institution}>
                        {institution}
                      </option>
                  ))}
                </select>
                {institutionError && (
                    <p className="validation">Please select a valid institution</p>
                )}

                <p className="acc-req2">
                  Already have an account?{" "}
                  <Link to="/login" className="acc-req2" id="link-to">
                    <b>Log in</b>
                  </Link>
                </p>
                <button
                    type="submit"
                    className={
                      !firstName ||
                      !lastName ||
                      !affiliation ||
                      !email ||
                      !pwd ||
                      (pwd && !confirmPwd) ||
                      !specialChar ||
                      !capitalLetter ||
                      !number ||
                      pwdUnmatched ||
                      emailError ||
                      institutionError
                          ? "disable-submit"
                          : "signup-btn2"
                    }
                    onClick={handleSubmit}
                    disabled={
                        !firstName ||
                        !lastName ||
                        !affiliation ||
                        !email ||
                        !pwd ||
                        (pwd && !confirmPwd) ||
                        !specialChar ||
                        !capitalLetter ||
                        !number ||
                        pwdUnmatched ||
                        emailError ||
                        institutionError
                    }
                >
                  Sign Up
                </button>
              </form>
            </div>
          </div>

          <div className="right-container2">
            {/* remove once given image */}
            <div className="image-placeholder2"></div>
          </div>
        </div>

        <div className="right-container2">
          <div className="images-container">
            <div className="stacked-images">
              <img src={hanleyImage} alt="Lab research" className="research-image" />
              <img src={toretskyImage} alt="Doctor with patient" className="research-image" />
            </div>
            <div className="yellow-overlay">
              <img src={yellowOverlay} alt="" className="overlay-image" />
            </div>
          </div>
        </div>
      </div>
  );
}

export default AccountPageReviewers;