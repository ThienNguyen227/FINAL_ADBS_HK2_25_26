import axios from "axios";

const API_URL = "http://localhost:3000/auth";

export const registerAPI = async (data) => {
  return axios.post(`${API_URL}/register-request`, data);
};

export const verifyOTPRegisterAPI = async (data) => {
  return axios.post(`${API_URL}/verify-otp-register-request`, data);
};

export const forgotPasswordAPI = async (data) => {
  return axios.post(`${API_URL}/forgot-password-request`, data);
};

export const verifyOTPForgotPasswordAPI = async (data) => {
  return axios.post(`${API_URL}/verify-otp-forgotpassword-request`, data);
};

export const ResetPasswordAPI = async (data) => {
  return axios.post(`${API_URL}/reset-password-request`, data);
};

// export const loginAPI = async (data) => {
//   return axios.post(`${API_URL}/login-request`, data);
// };

export const loginAPI = async (data) => {
  return axios.post(
    `${API_URL}/login-request`,
    data,
    {
      withCredentials: true
    }
  );
};

export const resendRegisterOTPAPI = async (data) => {
  return axios.post(`${API_URL}/resend-otp-register-request`, data);
};

export const resendForgotPasswordOTPAPI = async (data) => {
  return axios.post(`${API_URL}/resend-otp-forgotpassword-request`, data);
};

export const logOutAPI = async () => {
  const token = sessionStorage.getItem("token");

  return axios.put(
    `${API_URL}/logout`,
    {}, // body rỗng
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true 
    }
  );
};

export const refreshTokenAPI = () => {
  return axios.post(
    "http://localhost:3000/auth/refresh-token",
    {},
    {
      withCredentials: true
    }
  );
};