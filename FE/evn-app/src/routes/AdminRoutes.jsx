import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Customer from "../pages/admin/Customer";
import Contracts from "../pages/admin/Contracts";
import MeterReadings from "../pages/admin/MeterReadings";
import AnomalyDetection from "../pages/admin/AnomalyDetection";
import GeoMonitoring from "../pages/admin/GeoMonitoring";
import Billing from "../pages/admin/Billing";
import Reports from "../pages/admin/Reports";
import RoleGuard from "./RoleGuard";
import { Route } from "react-router-dom";

export default function AdminRoutes({ role, username }) {
  // Đảm bảo các route con được đăng ký đúng dưới /admin
  return (
    <Route path="/admin" element={<AdminLayout username={username} role={role} />}>

      {/* Ai cũng vào được */}
      <Route path="/admin/dashboard" element={<Dashboard />} />

      {/* Admin only */}
      <Route
        path="/admin/customers"
        element={
          <RoleGuard role={role} allow={["Admin"]}>
            <Customer />
          </RoleGuard>
        }
      />

      <Route
        path="/admin/contracts"
        element={
          <RoleGuard role={role} allow={["Admin"]}>
            <Contracts />
          </RoleGuard>
        }
      />

      {/* Operator + Admin */}
      <Route
        path="/admin/meter-readings"
        element={
          <RoleGuard role={role} allow={["Admin", "Operator"]}>
            <MeterReadings />
          </RoleGuard>
        }
      />

      <Route
        path="/admin/anomaly-detection"
        element={
          <RoleGuard role={role} allow={["Admin", "Operator"]}>
            <AnomalyDetection />
          </RoleGuard>
        }
      />

      <Route
        path="/admin/geo-monitoring"
        element={
          <RoleGuard role={role} allow={["Admin", "Operator"]}>
            <GeoMonitoring />
          </RoleGuard>
        }
      />

      {/* Billing + Admin */}
      <Route
        path="/admin/billing"
        element={
          <RoleGuard role={role} allow={["Admin", "Billing"]}>
            <Billing />
          </RoleGuard>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <RoleGuard role={role} allow={["Admin", "Billing"]}>
            <Reports />
          </RoleGuard>
        }
      />

    </Route>
  );
}