import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom"; 
import "../../styles/Register.css";

const ResetPassword = () => {

  const navigate = useNavigate();

   const location = useLocation();

   const { email } = location.state;

  const { resetPassword, loading, error, success } = useAuth();

  const [form, setForm] = useState({
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };
  
  // Kiểm tra điều kiện dữ liệu sơ bộ trong form
  const validate = () => {
    if (!form.password) {
      return "Vui lòng nhập đầy đủ thông tin!";
    }

    if (form.password.length < 6) {
      return "Mật khẩu phải >= 6 ký tự!";
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

    const res = await resetPassword({
        ...form,
        email
    });

    if (!res?.error) { 
        setTimeout(() => { navigate("/login") }, 2000); 
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Thay đổi mật khẩu</h2>
        

        <form onSubmit={handleSubmit}>
            <p className="otp-email">{email}</p>

          <input
            type="password"
            name="password"
            placeholder="Mật khẩu mới"
            value={form.password}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Đang đổi mật khẩu ..." : "Đổi mật khẩu"}
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
              Đăng ký
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;