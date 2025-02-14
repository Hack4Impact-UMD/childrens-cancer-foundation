import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { loginUser } from "../../services/auth_login";
import "./login.css";
import DrHanleyLabImage from "../../assets/Dr. Hanley Lab 1.png";
import toretsky from "../../assets/toretskywithpatient 1.png";
import yellowOverlay from "../../assets/yellowoverlay.png";

function Login() {
  const [input, setInput] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false)
  const [isWideScreen, setIsWideScreen] = useState<boolean>(
    window.innerWidth > 750
  );

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const email = input.email.toLowerCase().trim();
    const password = input.password;
    if (validateEmail(email) === false) {
      setError("Please enter a valid email address.");
    } else {
      const { error: loginError } = await loginUser(email, password);
      if (loginError) setError(loginError);
      else setLoggedIn(true)
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

          <label htmlFor="email">Email</label>
          <input
            name="email"
            placeholder="Enter your email"
            type="text"
            onChange={handleChange}
            value={input.email}
            required
            className="input"
          />
          <label htmlFor="password">Password</label>
          <input
            name="password"
            placeholder="Enter your password"
            onChange={handleChange}
            value={input.password}
            type="password"
            required
            className="input"
          />

          {error && <p className="error">{error}</p>}
          <button
            title="Login"
            aria-label="Login"
            type="submit"
            className="button"
          >
            Log in
          </button>
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