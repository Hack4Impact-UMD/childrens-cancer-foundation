
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../index";

interface PostGrantProtectedRouteProps {
  element: JSX.Element;
}

const PostGrantProtectedRoute: React.FC<PostGrantProtectedRouteProps> = ({ element }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isGrantRecipient, setIsGrantRecipient] = useState<boolean>(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const checkGrantStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const applicationsRef = collection(db, "applications");
        const q = query(
          applicationsRef,
          where("userId", "==", user.uid),
          where("status", "==", "APPROVED")
        );

        const querySnapshot = await getDocs(q);
        setIsGrantRecipient(!querySnapshot.empty);
        setLoading(false);
      } catch (error) {
        console.error("Error checking grant status:", error);
        setLoading(false);
      }
    };

    checkGrantStatus();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return element;
};

export default PostGrantProtectedRoute;