import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../index";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: any;
  role: "admin" | "reviewer" | "applicant" | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<AuthContextType["role"]>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserRole = async (uid: string): Promise<"admin" | "reviewer" | "applicant" | null> => {
      const roles: { collection: string; role: "admin" | "reviewer" | "applicant" }[] = [
        { collection: "adminUsers", role: "admin" },
        { collection: "reviewerUsers", role: "reviewer" },
        { collection: "applicantUsers", role: "applicant" }
      ];

      for (const { collection, role } of roles) {
        const ref = doc(db, collection, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return role;
        }
      }

      return null; // No matching role found
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const role = await fetchUserRole(firebaseUser.uid);
        setRole(role);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
