import React from "react";
import { Link } from "react-router-dom";
import "../login/login.css";
import "./CreateAccMenu.css"
import Button from "../../components/buttons/Button";
import { useState } from "react";
import DrHanleyLabImage from "../../assets/Dr. Hanley Lab 1.png";
import toretsky from "../../assets/toretskywithpatient 1.png";
import yellowOverlay from "../../assets/yellowoverlay.png";
import { useEffect } from "react";

function CreateAccMenu() {
    const [isWideScreen, setIsWideScreen] = useState<boolean>(
        window.innerWidth > 750
      );

      useEffect(() => {
        const handleResize = () => {
          setIsWideScreen(window.innerWidth > 750);
        };
    
        window.addEventListener("resize", handleResize);
        return () => {
          window.removeEventListener("resize", handleResize);
        };
      }, []);
  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-form">
          <div className="logo">
            <img src="/ccflogo.png" alt="Logo" className="logoImage" />
          </div>
          <h1 className="global-header">Create Account</h1>
          <p>Which account are you creating?</p>
          <Link to='/create-account-applicants' className="createAccLink">
          <Button 
              variant="red" 
              className="login-button">
            Applicant
          </Button>
          </Link>
          <Link to='/create-account-reviewers' className="createAccLink">
          <Button 
              variant="red"
              className="login-button">
            Reviewer
          </Button>
          </Link>
          <Link to="/login" className="backToLogin"><u>Back to log in</u></Link>
        </div>
        {isWideScreen && (
            <div className="login-imageContainer">
              <img src={DrHanleyLabImage} alt="Dr Hanley in the lab" className="login-image" />
              <img src={toretsky} alt="Researcher with patient" className="login-image" />
              <div className="login-yellowOverlay">
                <img src={yellowOverlay} alt="" aria-hidden="true" className="login-yellow" />
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

export default CreateAccMenu;
