import { useState } from "react";

import {
  getInvoicesAPI,
  getPaymentsByInvoiceAPI,
  updateInvoiceStatusAPI
} from "../services/adminService";

export const useAdminBilling = () => {

  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(false);

  const [successUpdate, setSuccessUpdate] = useState(null);

  const [errorUpdate, setErrorUpdate] = useState(null);

  // =========================
  // GET INVOICES
  // =========================
  const getInvoices = async (search = "") => {
    try {

      setLoading(true);

      const res = await getInvoicesAPI(search);

      setInvoices(res.data.invoices);

      return res.data;

    } catch (err) {

      console.error(err);

      throw err;

    } finally {

      setLoading(false);

    }
  };

  // =========================
  // GET PAYMENTS
  // =========================
  const getPaymentsByInvoice = async (invoiceId) => {
    try {

      const res = await getPaymentsByInvoiceAPI(invoiceId);

      return res.data;

    } catch (err) {

      console.error(err);

      throw err;

    }
  };

  // =========================
  // UPDATE STATUS
  // =========================
  const updateInvoiceStatus = async (data) => {
    try {

      setLoading(true);

      setSuccessUpdate(null);

      setErrorUpdate(null);

      const res = await updateInvoiceStatusAPI(data);

      setSuccessUpdate(res.data.message);

      return res.data;

    } catch (err) {

      const message =
        err.response?.data?.message ||
        "Cập nhật hóa đơn thất bại";

      setErrorUpdate(message);

      throw err;

    } finally {

      setLoading(false);

    }
  };

  return {
    invoices,
    loading,
    successUpdate,
    errorUpdate,
    getInvoices,
    getPaymentsByInvoice,
    updateInvoiceStatus
  };
};