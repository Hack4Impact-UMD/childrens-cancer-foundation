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
      try {
        if (user) {
          const idTokenResult = await user.getIdTokenResult();
          setIsReviewer(!!idTokenResult.claims.role && idTokenResult.claims.role === 'reviewer');
        } else {
          setIsReviewer(false);
        }
      } catch (error) {
        console.error('Error resolving auth role:', error);
        setIsReviewer(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Replace with a spinner if needed
  }

  return isReviewer ? <>{element}</> : <Navigate to="/protected-page" replace />;
};

export default ReviewerProtectedRoute;