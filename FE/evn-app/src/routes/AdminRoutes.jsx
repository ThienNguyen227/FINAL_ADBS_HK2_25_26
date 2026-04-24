import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Customer from "../pages/admin/Customer";
import Contracts from "../pages/admin/Contracts";
import MeterReadings from "../pages/admin/MeterReadings";
import AnomalyDetection from "../pages/admin/AnomalyDetection";
import Billing from "../pages/admin/Billing";
import Reports from "../pages/admin/Reports";
import RoleGuard from "./RoleGuard";
import { Route } from "react-router-dom";

export default function AdminRoutes({ role, username }) {
  return (
    <Route path="/admin" element={<AdminLayout username={username} role={role} />}>

      {/* Ai cũng vào được */}
      <Route path="dashboard" element={<Dashboard />} />

      {/* Admin only */}
      <Route
        path="customers"
        element={
          <RoleGuard role={role} allow={["Admin"]}>
            <Customer />
          </RoleGuard>
        }
      />

      <Route
        path="contracts"
        element={
          <RoleGuard role={role} allow={["Admin"]}>
            <Contracts />
          </RoleGuard>
        }
      />

      {/* Operator + Admin */}
      <Route
        path="meter-readings"
        element={
          <RoleGuard role={role} allow={["Admin", "Operator"]}>
            <MeterReadings />
          </RoleGuard>
        }
      />

      <Route
        path="anomaly-detection"
        element={
          <RoleGuard role={role} allow={["Admin", "Operator"]}>
            <AnomalyDetection />
          </RoleGuard>
        }
      />

      {/* Billing + Admin */}
      <Route
        path="billing"
        element={
          <RoleGuard role={role} allow={["Admin", "Billing"]}>
            <Billing />
          </RoleGuard>
        }
      />

      <Route
        path="reports"
        element={
          <RoleGuard role={role} allow={["Admin", "Billing"]}>
            <Reports />
          </RoleGuard>
        }
      />

    </Route>
  );
}