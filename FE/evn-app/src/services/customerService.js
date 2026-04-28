import axios from "axios";

const API_URL = "http://localhost:3001/customer";

// 1. 
export const getMoreInformationAPI = async (user_id) => {
  const token = sessionStorage.getItem("token");

  return axios.get(`${API_URL}/get-more-information`, {
    params: { user_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 2. 
export const updateCustomerInformationAPI = async (user_id, data) => {
  const token = sessionStorage.getItem("token");

  return axios.put(`${API_URL}/update-information`, data, {
    params: { user_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 3. 
export const getContractTypeAPI = async () => {
  const token = sessionStorage.getItem("token");

  return axios.get(`${API_URL}/get-contract-type`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 4. 
export const registerContractAPI = async (payload) => {
  const token = sessionStorage.getItem("token");

  return axios.post(`${API_URL}/register-contract`, payload,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 5.
export const getContractsAPI = async (customer_id) => {
  const token = sessionStorage.getItem("token");

  return axios.get(`${API_URL}/get-contract`, {
    params: { customer_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 6.
// export const cancelContractAPI = async (contract_id) => {
//   const token = sessionStorage.getItem("token");

//   return axios.put(`${API_URL}/cancel-contract`, {
//     params: { contract_id },
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

export const cancelContractAPI = async (contract_id) => {
  const token = sessionStorage.getItem("token");

  return axios.put(`${API_URL}/cancel-contract`, { contract_id },
    {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    }
  );
};

