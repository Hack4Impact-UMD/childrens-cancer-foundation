import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../index';
import { User } from 'firebase/auth';

interface ReviewerProtectedRouteProps {
  element: React.ReactNode;
}

const ReviewerProtectedRoute: React.FC<ReviewerProtectedRouteProps> = ({ element }) => {
  const [loading, setLoading] = useState(true);
  const [isReviewer, setIsReviewer] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        setIsReviewer(!!idTokenResult.claims.role && idTokenResult.claims.role === 'reviewer');
      } else {
        setIsReviewer(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Replace with a spinner if needed
  }

  return isReviewer ? <>{element}</> : <Navigate to="/login" replace />;
};

export default ReviewerProtectedRoute;