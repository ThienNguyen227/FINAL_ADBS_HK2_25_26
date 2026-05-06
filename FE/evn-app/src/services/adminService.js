import axios from "axios";

const API_URL = "http://localhost:3000/auth";

const token = () => sessionStorage.getItem("token");

export const getAccountsAPI = (search = "") =>
  axios.get(`${API_URL}/admin/accounts`, {
    params: { search },
    headers: { Authorization: `Bearer ${token()}` }
  });

export const getRolesAPI = () =>
  axios.get(`${API_URL}/admin/roles`, {
    headers: { Authorization: `Bearer ${token()}` }
  });

export const createAccountAPI = (data) =>
  axios.post(`${API_URL}/admin/account-create`, data, {
    headers: { Authorization: `Bearer ${token()}` }
  });

export const updateAccountAPI = (data) =>
  axios.put(`${API_URL}/admin/account-update`, data, {
    headers: { Authorization: `Bearer ${token()}` }
  });

export const lockAccountAPI = (data) =>
  axios.put(`${API_URL}/admin/account-lock`, data, {
    headers: { Authorization: `Bearer ${token()}` }
  });

export const deleteAccountAPI = (id) =>
  axios.delete(`${API_URL}/admin/account-delete/${id}`, {
    headers: { Authorization: `Bearer ${token()}` }
  });