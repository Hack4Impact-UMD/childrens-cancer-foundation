import React from "react";
import { useNavigate } from "react-router-dom";
import "./error.css";
import logo from '../../assets/ccf-logo.png';

type ErrorProps = {
  type: "404" | "505" | "401";
};

function ErrorPage({ type }: ErrorProps): JSX.Element {
  const navigate = useNavigate();

  const renderErrorMessage = () => {
    switch (type) {
      case "404":
        return (
          <>
            <button onClick={goToHome} className = "logo-button"><img src={logo} alt="Logo" className = "logo"/></button>
            <h1 className="big">404</h1>
            <p className="page-not-found">Oops... Page Not Found!</p>
            <p className="error-message">The page that you were looking for 
            does not exist or has been moved</p>
          </>
        );
      case "505":
        return (
          <>
            <button onClick={goToHome} className = "logo-button"><img src={logo} alt="Logo" className = "logo"/></button>
            <h1 className="big">505</h1>
            <p className="page-not-found">Oops... Server Error!</p>
            <p className="error-message">Something went wrong.</p>
          </>
        );
      case "401":
        return (
          <>
          <button onClick={goToLogin} className = "logo-button"><img src={logo} alt="Logo" className = "logo"/></button>
          <h1 className="big">401</h1>
          <p className="page-not-found">Unauthorized Access</p>
          <p className="error-message">You are not authorized to access this page. Please log in to continue.</p>
          </>
        )
      default:
        return null;
    }
  };

  const goToHome = () => {
    navigate("/");
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="main-container-error">
    <div className="error-page-container">
      <div className="error-content">
        {renderErrorMessage()}
        {type === "401" ? (
          <button onClick={goToLogin} className="error-button">Go To Login</button>
        ) : (
          <button onClick={goToHome} className="error-button">Back to Home</button>
        )}
      </div>
    </div>
  </div>
);
}

export default ErrorPage;
