import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom"; // Chuyển trang
import "../../styles/Register.css";

const Register = () => {

  const navigate = useNavigate();

  const { register, loading, error, success } = useAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
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
    if (!form.name || !form.phone || !form.email || !form.password) {
      return "Vui lòng nhập đầy đủ thông tin!";
    }

    if (!/^\d+$/.test(form.phone)) {
      return "Số điện thoại không hợp lệ!";
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

    const res = await register(form);

    if (!res?.error) {
      setTimeout(() => {
        navigate("/verify-otp", {
          state: {
            type: "REGISTER",
            name: form.name, 
            phone: form.phone,
            email: form.email, 
            password: form.password,
          },
        });
      }, 2000);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Đăng ký</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Tên"
            value={form.name}
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Đang đăng ký ..." : "Đăng ký"}
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
            <span onClick={() => navigate("/forgot-password")}>
              Quên mật khẩu?
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;