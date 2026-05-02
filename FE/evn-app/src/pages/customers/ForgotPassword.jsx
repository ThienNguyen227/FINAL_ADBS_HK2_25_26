import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom"; // Chuyển trang
import "../../styles/Register.css";

const ForgotPassword = () => {

  const navigate = useNavigate();

  const { forgotPassword, loading, error, success } = useAuth();

  const [form, setForm] = useState({
    email: "",
    newPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };
  
  // Kiểm tra điều kiện dữ liệu sơ bộ trong form
  const validate = () => {
    if (!form.email || !form.newPassword) {
      return "Vui lòng nhập đầy đủ thông tin!";
    }

    if (form.newPassword.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự!";
    }

    return null;
  };

  // Xử lý khi nhấn submit 
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validateError = validate();
    if (validateError) {
      alert(validateError);
      return;
    }

    const res = await forgotPassword(form);

    if (!res?.error) {
      setTimeout(() => {
        navigate("/verify-otp", {
          state: {
            type: "FORGOT_PASSWORD",
            email: form.email, 
            newPassword: form.newPassword,
            expiresAt: res.expiresAt,
          },
        });
      }, 2000);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Quên mật khẩu</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Nhập Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="newPassword"
            placeholder="Nhập mật khẩu mới"
            value={form.newPassword}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Đang kiểm tra tài khoản ..." : "Kiểm tra tài khoản"}
          </button>
        </form>

        {/* Thông báo */}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* Điều hướng sang login / quên mật khẩu */}
        <div className="links">
          <p>
            Đã có tài khoản?{" "}
            <span onClick={() => navigate("/login")}>
              Đăng nhập
            </span>
          </p>

          <p>
            <span onClick={() => navigate("/register")}>
              Đăng ký?
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;