import axios from "axios";

const API_URL = "http://localhost:3003/billing";

export const getInvoicesAPI = async (customer_id) => {
  const token = sessionStorage.getItem("token");

  return axios.get(`${API_URL}/invoices`, {
    params: { customer_id },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const createPaymentAPI = async (invoice_id, method) => {
  const token = sessionStorage.getItem("token");

  return axios.post(
    `${API_URL}/payments`,
    { invoice_id, method },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};