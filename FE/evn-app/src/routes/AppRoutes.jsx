import { Routes } from "react-router-dom";
import AdminRoutes from "./AdminRoutes";
import CustomerRoutes from "./CustomerRoutes";
import { useAuth } from "../hooks/useAuth";

export default function AppRoutes() {
  const { user } = useAuth();
  
  // map role id -> role name
  const roleMap = {
    1: "Admin",
    2: "Operator",
    3: "Billing",
    4: "Customer",
  };

  const role = roleMap[user?.user_role_id] || "Guest";
  const username = user?.user_name || "Guest";

  return (
    <Routes>
      {AdminRoutes({ username, role })}
      {CustomerRoutes()}
    </Routes>
  );
}