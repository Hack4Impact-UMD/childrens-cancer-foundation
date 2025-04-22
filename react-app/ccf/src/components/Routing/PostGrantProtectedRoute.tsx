
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getRole, getCurrentUserClaims} from "../../services/auth_login";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../index";

interface PostGrantProtectedRouteProps {
    element: JSX.Element;
  }
  
  const PostGrantProtectedRoute: React.FC<PostGrantProtectedRouteProps> = ({ element }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    
    useEffect(() => {
      const auth = getAuth();
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        
        try {
          const role = await getRole();
          
          if (role === 'applicant') {
            const applicationsRef = collection(db, "applications");
            const q = query(
              applicationsRef, 
              where("userId", "==", user.uid),
              where("status", "==", "APPROVED")
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              setHasAccess(true);
            } else {
              setHasAccess(false);
            }
          } else {
            setHasAccess(false);
          }
        } catch (error) {
          console.error('Error verifying access:', error);
          setHasAccess(false);
        }
        
        setLoading(false);
      });
      
      return () => unsubscribe();
    }, []);
  
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (!hasAccess) {
      return <Navigate to="/applicant-dashboard" replace />;
    }
    
    return element;
  };
  
  export default PostGrantProtectedRoute;