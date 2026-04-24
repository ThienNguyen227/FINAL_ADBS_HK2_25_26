import { useState } from "react";
import { registerAPI, verifyOTPRegisterAPI, forgotPasswordAPI, verifyOTPForgotPasswordAPI, ResetPasswordAPI, resendRegisterOTPAPI } from "../services/authService";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = ()  => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const context = useContext(AuthContext);

  // 1. Yêu cầu đăng ký
  const register = async (data) => 
  {
    try 
    {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await registerAPI(data);
      setSuccess(res.data?.message);
      return res.data;

    } catch (err) {
      const message = err.response?.data?.message || "Có lỗi xảy ra";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  // 2. Xác nhận OTP đăng ký 
  const verifyOTP = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await verifyOTPRegisterAPI(data);
      setSuccess(res.data?.message);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "OTP không hợp lệ";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  // 3. Yêu cầu đổi mật khẩu 
  const forgotPassword = async (data) => 
  {
    try 
    {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await forgotPasswordAPI(data);
      setSuccess(res.data?.message);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "Có lỗi xảy ra";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  // 4. Xác nhận OTP quên mật khẩu 
  const verifyOTPForgotPassword = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await verifyOTPForgotPasswordAPI(data);
      setSuccess(res.data?.message);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "OTP không hợp lệ";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  // 5. Thay đổi mật khẩu 
  const resetPassword = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await ResetPasswordAPI(data);
      setSuccess(res.data?.message);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "OTP không hợp lệ";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  // 6. Resend OTP register
  const resendRegisterOTP = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await resendRegisterOTPAPI(data);
      setSuccess(res.data?.message);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || "OTP không hợp lệ";
      setError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  // 7. Resend OTP forgot password
  // const resendForgotPasswordOTP = async (data) => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     setSuccess(null);
  //     const res = await resendForgotPasswordOTPAPI(data);
  //     setSuccess(res.data?.message);
  //     return res.data;
  //   } catch (err) {
  //     const message = err.response?.data?.message || "OTP không hợp lệ";
  //     setError(message);
  //     return { error: message };
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  return {
    ...context,
    register,
    verifyOTP,
    forgotPassword,
    verifyOTPForgotPassword,
    resetPassword,
    loading,
    success,
    error,
    resendRegisterOTP,
    // resendForgotPasswordOTP,
  };
};
