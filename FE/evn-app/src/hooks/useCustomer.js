import { useState} from "react";
import { getMoreInformationAPI, updateCustomerInformationAPI, getContractTypeAPI, registerContractAPI, getContractsAPI } from "../services/customerService";

export const useCustomer = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [contracttype, setContracttype] = useState(null);

  const [contracts, setContracts] = useState([]);

  // 4.
  const [errorRegisterContract, setErrorRegisterContract] = useState(null);
  const [successRegisterContract, setSuccessRegisterContract] = useState(null);

  // 1. 
  const getMoreInformation = async (user_id) => {
    try {
      setLoading(true);
      setError(null);

      const res = await getMoreInformationAPI(user_id);
      setCustomer(res.data.customer);

      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Lỗi lấy thông tin customer";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  // 2. 
  const updateCustomerInformation = async (user_id, data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await updateCustomerInformationAPI(user_id, data);

      setCustomer(res.data.customer);
      setSuccess(res.data.message)

      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Lỗi cập nhật thông tin customer";
      setError(message);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  // 3. 
  const getContractType = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await getContractTypeAPI();

      setContracttype(res.data.contracttype);
      setSuccess(res.data.message)

      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Lỗi lấy loại hợp đồng";
      setError(message);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  // 4. 
  const registerContract = async (payload) => {
    try {
      setLoading(true);
      setErrorRegisterContract(null);
      setSuccessRegisterContract(null);

      const res = await registerContractAPI(payload);

      setSuccessRegisterContract(res.data.message)

      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Lỗi đăng ký hợp đồng";
      setErrorRegisterContract(message);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  // 5. 
  const getContracts = async (customer_id) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const res = await getContractsAPI(customer_id);

      setContracts(res.data.contracts);
      setSuccess(res.data.message)

      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Lỗi lấy các hợp đồng";
      setError(message);
      throw err; 
    } finally {
      setLoading(false);
    }
  };
  


  return {
    customer,
    loading,
    error,
    success,
    contracttype,
    getMoreInformation,
    updateCustomerInformation, 
    getContractType,
    registerContract,
    errorRegisterContract,
    setErrorRegisterContract,
    successRegisterContract,
    setSuccessRegisterContract,
    getContracts, 
    contracts,
  };
};