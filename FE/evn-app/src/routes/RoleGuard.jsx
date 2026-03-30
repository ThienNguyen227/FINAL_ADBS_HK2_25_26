import { Navigate } from "react-router-dom";


export default function RoleGuard({ role, allow, children }) {
  if (!allow.includes(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}