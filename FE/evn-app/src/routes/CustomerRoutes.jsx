import { Route } from "react-router-dom";
import CustomersLayout from "../layouts/CustomersLayout";
import MyBilling from "../pages/customers/MyBilling";
import MyInformation from "../pages/customers/MyInformation";
import MyContract from "../pages/customers/MyContract";
import MyUsage from "../pages/customers/MyUsage";
import Register from "../pages/customers/Register";
import VerifyOTP from "../pages/customers/VerifyOTP";
import ForgotPassword from "../pages/customers/ForgotPassword"
import ResetPassword from "../pages/customers/ResetPassword"
import Login from "../pages/customers/Login"
import ProtectedRoute from "./ProtectedRoute"


export default function CustomerRoutes() {
  return (
    <>
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersLayout />
          </ProtectedRoute>
        }
      >
        <Route path="myinformation" element={<MyInformation />} />
        <Route path="mycontract" element={<MyContract />} />
        <Route path="mybilling" element={<MyBilling />} />
        <Route path="myusage" element={<MyUsage />} />
      </Route>
    </>
  );
}