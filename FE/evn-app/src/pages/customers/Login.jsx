import React, { useState } from "react";
// import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom"; 
import "../../styles/Register.css";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {

  const navigate = useNavigate();

  const { login, loading, error, success, setError, setSuccess } = useContext(AuthContext);

  const [form, setForm] = useState({
    phone: "",
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
    if (!form.phone ||!form.password) {
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

    const res = await login(form);

    // Cần chỉnh
    if (!res?.error) {
      setTimeout(() => {
        navigate("/customers/myinformation", {
          state: {
            
          },
        });
      }, 2000);
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Đăng nhập</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="phone"
            placeholder="Số điện thoại"
            value={form.phone}
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
            {loading ? "Đang đăng nhập ..." : "Đăng nhập"}
          </button>
        </form>

        {/* Thông báo */}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* Điều hướng sang login / quên mật khẩu */}
        <div className="links">
          <p>
            Chưa có tài khoản?{" "}
            <span onClick={() => navigate("/register")}>
              Đăng ký
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

export default Login;