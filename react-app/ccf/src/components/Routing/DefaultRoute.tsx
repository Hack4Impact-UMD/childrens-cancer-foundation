import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const DefaultRoute = () => {
  const { role, loading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!role) {
        setRedirectPath("/login");
      } else if (role === "applicant") {
        setRedirectPath("/applicant-dashboard");
      } else if (role === "reviewer") {
        setRedirectPath("/reviewer-dashboard");
      } else if (role === "admin") {
        setRedirectPath("/admin-dashboard");
      }
    const getRoute = async () => {
        getRole().then((role) => {
            if (!role) {
                setTo("/login")
            } else if (role == "applicant") {
                setTo("/applicant/dashboard")
            } else if (role == "reviewer") {
                setTo("/reviewer/dashboard")
            } else if (role == "admin") {
                setTo("/admin/dashboard")
            }
        })
    }
  }, [role, loading]);

  if (loading || redirectPath === null) {
    return null; // or a loading spinner
  }

  return <Navigate to={redirectPath} replace />;
};

export default DefaultRoute;
