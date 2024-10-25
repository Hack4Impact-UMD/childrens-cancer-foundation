import React, { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../services/auth_login";
import "./../styles/login.css";

function Login() {
  const [input, setInput] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const email = input.email.toLowerCase().trim();
    const password = input.password;

    const { error: loginError } = await loginUser(email, password);
    if (loginError) setError(loginError);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <div className="logo">
          <img src="/ccflogo.png" alt="Logo" className="logoImage" />
        </div>
        <h1 className="heading">Welcome!</h1>
        <p>
          New to Children’s Cancer Foundation? <Link to="/signup">Sign Up</Link>
        </p>
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
        <div className="rememberMe">
          <input type="checkbox" id="remember" />
          <label htmlFor="remember"> Remember me for 30 days</label>
        </div>
        {error && <p className="error">{error}</p>}
        <button title="Login" aria-label="Login" type="submit" className="button">
          Log in
        </button>
        <Link to="/forgot-password" className="forgotPasswordLink">Forgot password?</Link>
      </form>
    </div>
  );
}

export default Login;