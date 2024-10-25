import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { handleSignup } from "./../services/auth_signup";
import './../styles/signup.css';

const Signup: React.FC = () => {
  const [input, setInput] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasSpecialChar: false,
    hasCapitalLetter: false,
    hasNumber: false,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "password" || name === "confirmPassword") {
      const updatedPassword = name === "password" ? value : input.password;
      const updatedConfirmPassword =
        name === "confirmPassword" ? value : input.confirmPassword;

      setPasswordRequirements({
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(updatedPassword),
        hasCapitalLetter: /[A-Z]/.test(updatedPassword),
        hasNumber: /\d/.test(updatedPassword),
      });

      if (updatedPassword === "" && updatedConfirmPassword === "") {
        setError(null);
      } else if (updatedPassword === updatedConfirmPassword) {
        setError(null);
      } else {
        setError("Passwords do not match.");
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    handleSignup(input, setError);
  };

  return (
    <div className="signupContainer">
      <div className="formContainer">
        <div className="logo">
          <img src="/ccflogo.png" alt="Logo" className="logoImage" />
        </div>
        <h1 className="heading">Create Account</h1>
        <form autoComplete="off" onSubmit={handleSubmit}>
          <div className="inputGroup">
            <div>
              <label htmlFor="firstName">First Name</label>
              <input
                name="firstName"
                placeholder="Enter your first name"
                type="text"
                onChange={handleChange}
                value={input.firstName}
                required
                className="input"
              />
            </div>
            <div>
              <label htmlFor="lastName">Last Name</label>
              <input
                name="lastName"
                placeholder="Enter your last name"
                type="text"
                onChange={handleChange}
                value={input.lastName}
                required
                className="input"
              />
            </div>
          </div>
          <label htmlFor="email">Email</label>
          <input
            name="email"
            placeholder="Enter your email"
            type="email"
            onChange={handleChange}
            value={input.email}
            required
            className="input"
          />
          <label htmlFor="password">Password</label>
          <input
            name="password"
            placeholder="Create a password"
            onChange={handleChange}
            value={input.password}
            type="password"
            required
            className="input"
          />
          <div className="passwordRequirements">
            <p>Password requires:</p>
            <ul>
              <li style={{ color: passwordRequirements.hasSpecialChar ? "green" : "red" }}>
                One special character
              </li>
              <li style={{ color: passwordRequirements.hasCapitalLetter ? "green" : "red" }}>
                One capital letter
              </li>
              <li style={{ color: passwordRequirements.hasNumber ? "green" : "red" }}>
                One number
              </li>
            </ul>
          </div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            name="confirmPassword"
            placeholder="Enter password again"
            onChange={handleChange}
            value={input.confirmPassword}
            type="password"
            required
            className="input"
          />
          {error && <p className="errorMessage">{error}</p>}
          <button type="submit" className="button">Sign Up</button>
        </form>
        <p className="loginLink">
          Already have an account? <Link to="/login" className="loginLinkAnchor">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;