import "./CreateAccReviewer.css";
import logo from '../../assets/ccf-logo.png';
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc } from "firebase/firestore";

function AccountPageReviewers(): JSX.Element {
  //form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [affiliation, setAffiliation] = useState("");

  //password reqs
  const [specialChar, setSpecialChar] = useState(false);
  const [capitalLetter, setCapitalLetter] = useState(false);
  const [number, setNumber] = useState(false);
  const [showReqs, setShowReqs] = useState(false);
  const [pwdUnmatched, setPwdUnmatched] = useState(false);

  //email req
  const [emailError, setEmailError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {}, [
    firstName,
    lastName,
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const functions = getFunctions();
    const addReviewerRole = httpsCallable(functions, "addReviewerRole");
    // don't let user submit if pwd reqs aren't met
    console.log(specialChar, capitalLetter, number, showReqs, pwdUnmatched);
    if (!specialChar || !capitalLetter || !number || pwdUnmatched) {
      console.log("Failed to submit. One requirement was not met.");
      e.preventDefault();
      return;
    }

    const auth = getAuth();
    const db = getFirestore();
    let user = null
 
 
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pwd);
      user = userCredential.user;
      await setDoc(doc(db, 'reviewers', user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        affiliation: affiliation,
        role: 'reviewer',
      });
      await addReviewerRole({email: email})
      .then((result) => {
        console.log(result.data);  // Success message from the function
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
      
      navigate("/");
    } catch (error) {
      if(user !== null){
        await deleteUser(user);
        await deleteDoc(doc(db, 'reviewers', user.uid));
      }
      console.log(error);
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
              <div
                className={
                  !pwdUnmatched
                    ? "confirm-pwd-container"
                    : "confirm-pwd-container-exclaim"
                }
              >
                <input
                  type="password"
                  placeholder="Enter password again"
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  onKeyUp={checkConfirmPwd}
                  className="input"
                />
                {pwdUnmatched && <p id="exclaim">!</p>}
              </div>

              {pwdUnmatched && (
                <p className="validation">Passwords do not match</p>
              )}

              <label>Institution/Hospital Affiliation*</label>
              <input
                type="text"
                placeholder="Enter hospital name"
                required
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                className="input"
              />

              <p className="acc-req2">
                Already have an account?{" "}
                <Link to="/login" className="acc-req2" id="link-to">
                  <b>Log in</b>
                </Link>{" "}
              </p>
              <button
                type="submit"
                className={(
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
                  emailError) ? "disable-submit" : "signup-btn2"}
                onClick={handleSubmit}
                disabled={(
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
                  emailError)}
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
    </div>
  );
}

export default AccountPageReviewers;
