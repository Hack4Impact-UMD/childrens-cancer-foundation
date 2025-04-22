import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const RoleCheck = ({ role: requiredRole, children }: { role: string, children: JSX.Element }) => {
  const { user, role, loading } = useAuth();

  if (loading) return null; // Or a spinner
  if (role !== requiredRole) return <Navigate to="/protected-page" />;

  return children;
};