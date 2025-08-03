import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { loginUser } from "../../services/auth_login";
import { resendEmailVerification } from "../../utils/emailActionUtils";
import "./login.css";
import DrHanleyLabImage from "../../assets/Dr. Hanley Lab 1.png";
import toretsky from "../../assets/toretskywithpatient 1.png";
import yellowOverlay from "../../assets/yellowoverlay.png";
import Button from "../../components/buttons/Button";
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function Login() {
  const [input, setInput] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false)
  const [showResendButton, setShowResendButton] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(
    window.innerWidth > 750
  );
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setShowResendButton(false);
    const email = input.email.toLowerCase().trim();
    const password = input.password;
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
    } else {
      const result = await loginUser(email, password);
      if (result.error) {
        setError(result.error);
        if (result.emailNotVerified) {
          setShowResendButton(true);
        }
      } else {
        setLoggedIn(true);
      }
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const result = await loginUser(input.email.toLowerCase().trim(), input.password);
      if (result.emailNotVerified) {
        const resendResult = await resendEmailVerification();
        if (resendResult.success) {
          setError("A new verification email has been sent. Please check your email.");
          setShowResendButton(false);
        } else {
          setError(resendResult.message);
        }
      }
    } catch (error) {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

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
    <div className="container">
      {loggedIn && <Navigate to="/" replace={true} />}
      <div className="content">
        <form className="form" onSubmit={handleSubmit}>
          <div className="logo">
            <img src="/ccflogo.png" alt="Logo" className="logoImage" />
          </div>
          <h1 className="heading">Welcome!</h1>
          <div className="loginText">
            <p>
              New to CCF?{" "}
              <Link to="/create-account-menu">
                <u>Create Account</u>
              </Link>
            </p>
          </div>
            <TextField
              id="outlined-basic"
              label="Email"
              name="email"
              variant="outlined"
              onChange={handleChange}
              value={input.email}
              required
              sx={{
                width: '90%',
                paddingBottom: '20px'
              }}
            />

            {/* <label htmlFor="email">Email</label>
          <input
            name="email"
            placeholder="Enter your email"
            type="text"
            onChange={handleChange}
            value={input.email}
            required
            className="input"
          /> */}

            <TextField
              id="outlined-basic"
              type={showPassword ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              name="password"
              label="Password"
              variant="outlined"
              onChange={handleChange}
              value={input.password}
              required
              sx={{
                width: '90%',
                paddingBottom: '20px'
              }}
            />
          {/* <label htmlFor="password">Password</label>
          <input
            name="password"
            placeholder="Enter your password"
            onChange={handleChange}
            value={input.password}
            type="password"
            required
            className="input"
          /> */}

          {error && <p className="error">{error}</p>}
          
          {showResendButton && (
            <button 
              type="button" 
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="resend-verification-btn"
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}
          
          <Button variant={"red"} type={"submit"} className={"button"}>
            <>
              Login
            </>
          </Button>
          <div className="loginText">
            <Link to="/forgot-password" className="forgotPasswordLink">
              <u>Forgot password</u>
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

export default Login;