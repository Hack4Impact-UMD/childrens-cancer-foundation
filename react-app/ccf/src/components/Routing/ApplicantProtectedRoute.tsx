import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../index';
import { User } from 'firebase/auth';

interface ApplicantProtectedRouteProps {
  element: React.ReactNode;
}

const ApplicantProtectedRoute: React.FC<ApplicantProtectedRouteProps> = ({ element }) => {
  const [loading, setLoading] = useState(true);
  const [isApplicant, setIsApplicant] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        setIsApplicant(!!idTokenResult.claims.role && idTokenResult.claims.role === 'applicant');
      } else {
        setIsApplicant(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; 
  }

  return isApplicant ? <>{element}</> : <Navigate to="/login" replace />;
};

export default ApplicantProtectedRoute;