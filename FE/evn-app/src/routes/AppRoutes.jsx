import { Routes } from "react-router-dom";
import AdminRoutes from "./AdminRoutes";
import CustomerRoutes from "./CustomerRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      {AdminRoutes({ username: "Thiên", role: "Operator" })}
      {CustomerRoutes()}
    </Routes>
  );
}