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