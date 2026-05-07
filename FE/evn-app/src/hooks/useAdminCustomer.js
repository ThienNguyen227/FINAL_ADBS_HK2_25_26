import { useState } from "react";
import {
  getCustomersAPI,
  updateCustomerAPI
} from "../services/adminService";

export const useAdminCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [successUpdate, setSuccessUpdate] = useState(null);
  const [errorUpdate, setErrorUpdate] = useState(null);

  // =========================
  // GET CUSTOMERS
  // =========================
  const getCustomers = async (search = "") => {
    try {
      setLoading(true);
      const res = await getCustomersAPI(search);
      setCustomers(res.data.customers);
      return res.data;
    } catch (err) {
      console.error("Get customers error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPDATE CUSTOMER (FIXED STYLE)
  // =========================
  const updateCustomer = async (data) => {
    try {
      setLoading(true);

      setSuccessUpdate(null);
      setErrorUpdate(null);

      const res = await updateCustomerAPI(data);

      setSuccessUpdate(res.data.message);

      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Cập nhật khách hàng thất bại!";
      setErrorUpdate(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    loading,
    successUpdate,
    errorUpdate,
    getCustomers,
    updateCustomer
  };
};