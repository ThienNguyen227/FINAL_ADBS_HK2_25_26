import { useState } from "react";
import {
  getContractsAPI,
  updateContractAPI
} from "../services/adminService";

export const useAdminContract = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [successUpdate, setSuccessUpdate] = useState(null);
  const [errorUpdate, setErrorUpdate] = useState(null);

  const getContracts = async (search = "") => {
    try {
      setLoading(true);
      const res = await getContractsAPI(search);
      setContracts(res.data.contracts);
    } finally {
      setLoading(false);
    }
  };

  const updateContract = async (data) => {
    try {
      setLoading(true);
      setSuccessUpdate(null);
      setErrorUpdate(null);

      const res = await updateContractAPI(data);

      setSuccessUpdate(res.data.message);
      return res.data;
    } catch (err) {
      const msg =
        err.response?.status === 409
          ? "Hợp đồng đang được chỉnh sửa ở nơi khác"
          : err.response?.data?.message || "Cập nhật thất bại";

      setErrorUpdate(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    contracts,
    loading,
    successUpdate,
    errorUpdate,
    getContracts,
    updateContract
  };
};