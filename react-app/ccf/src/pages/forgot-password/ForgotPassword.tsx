import React, { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../../services/auth_login";
import "./ForgotPassword.css";
import DrHanleyLabImage from "../../assets/Dr. Hanley Lab 1.png";
import toretsky from "../../assets/toretskywithpatient 1.png";
import yellowOverlay from "../../assets/yellowoverlay.png";
import Button from "../../components/buttons/Button";
import { TextField } from '@mui/material';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(
    window.innerWidth > 750
  );

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    const trimmedEmail = email.toLowerCase().trim();
    
    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    
    try {
      const { success, error: resetError } = await resetPassword(trimmedEmail);
      
      if (success) {
        setMessage("Password reset email sent! Please check your inbox and follow the instructions to reset your password.");
        setEmail(""); // Clear the email field on success
      } else {
        setError(resetError || "An error occurred while sending the password reset email.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  React.useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth > 750);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="container">
      <div className="content">
        <form className="form" onSubmit={handleSubmit}>
          <div className="logo">
            <img src="/ccflogo.png" alt="Logo" className="logoImage" />
          </div>
          <h1 className="heading">Reset Password</h1>
          <p className="description">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <TextField
            id="outlined-basic"
            label="Email"
            name="email"
            variant="outlined"
            onChange={handleChange}
            value={email}
            required
            disabled={isLoading}
            sx={{
              width: '90%',
              paddingBottom: '20px'
            }}
          />

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          
          <Button 
            variant={"red"} 
            type={"submit"} 
            className={"button"}
            disabled={isLoading}
          >
            <>
              {isLoading ? "Sending..." : "Send Reset Email"}
            </>
          </Button>
          
          <div className="loginText">
            <Link to="/login" className="backToLoginLink">
              <u>Back to Login</u>
            </Link>
          </div>
        </form>

        {isWideScreen && (
          <div className="imageContainer">
            <img src={DrHanleyLabImage} alt="image" className="images" />
            <img src={toretsky} alt="image" className="images" />
            <div className="yellowOverlay">
              <img src={yellowOverlay} alt="overlay" className="yellow" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;

