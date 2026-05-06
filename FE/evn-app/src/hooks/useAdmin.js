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
  const [successUpdate, setSuccessUpdate] = useState(null); // Update
  const [errorUpdate, setErrorUpdate] = useState(null); // Update

  const [successCreate, setSuccessCreate] = useState(null); // Create
  const [errorCreate, setErrorCreate] = useState(null); // Create

  // 1. LOAD ACCOUNTs
  const getAccounts = async (search = "") => {
    setLoading(true);
    const res = await getAccountsAPI(search);
    setAccounts(res.data.accounts);
    setLoading(false);
  };

  // 2. LOAD ROLEs
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
      const message = err.response?.data?.message || "Cập nhật thất bại!";
      setErrorUpdate(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. CREATE
  const createAccount = async (data) => {
    try {
      setLoading(true);
      setSuccessCreate(null);
      setErrorCreate(null);
      const res = await createAccountAPI(data);
      setSuccessCreate(res.data.message);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Tạo tài khoản thất bại!";
      setErrorCreate(message);
      throw err;
    } finally {
      setLoading(false);
    }
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
    setErrorUpdate,
    successCreate,
    errorCreate
  };
};