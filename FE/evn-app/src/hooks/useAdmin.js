import { useState } from "react";
import {
  getAccountsAPI,
  createAccountAPI,
  updateAccountAPI,
  lockAccountAPI,
  deleteAccountAPI,
  getRolesAPI
} from "../services/adminService";

export const useAdmin = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [successUpdate, setSuccessUpdate] = useState(null);
  const [errorUpdate, setErrorUpdate] = useState(null);

  // 1. LOAD ACCOUNTs
  const getAccounts = async (search = "") => {
    setLoading(true);
    const res = await getAccountsAPI(search);
    setAccounts(res.data.accounts);
    setLoading(false);
  };

  // 2. LOAD ROLs
  const getRoles = async () => {
    const res = await getRolesAPI();
    setRoles(res.data.roles);
  };

  // 3. UPDATE
  const updateAccount = async (data) => {
    try {
      setLoading(true);
      setSuccessUpdate(null);
      setErrorUpdate(null);
      const res = await updateAccountAPI(data);
      setSuccessUpdate(res.data.message);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Cập nhật thất bại";
      setErrorUpdate(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (data) => {
    await createAccountAPI(data);
  };

  const lockAccount = async (data) => {
    await lockAccountAPI(data);
  };

  const deleteAccount = async (id) => {
    await deleteAccountAPI(id);
  };

  return {
    accounts,
    loading,
    getAccounts,
    createAccount,
    updateAccount,
    lockAccount,
    deleteAccount,
    roles,
    getRoles,
    successUpdate, 
    errorUpdate,
    setErrorUpdate
  };
};