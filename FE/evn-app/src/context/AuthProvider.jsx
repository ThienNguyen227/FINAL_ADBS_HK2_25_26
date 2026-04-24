import { useState, useEffect } from "react";
import axios from "axios";
import { loginAPI } from "../services/authService";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const login = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await loginAPI(data);
      const token = res.data.accessToken;
      // localStorage.setItem("token", token);
      sessionStorage.setItem("token", token);

      const me = await axios.get(
        "http://localhost:3000/auth/me-request",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(me.data.user);
      setSuccess(res.data.message);

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
      return { error: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // localStorage.removeItem("token");
    sessionStorage.setItem("token");
    setUser(null);
  };

  useEffect(() => {
    // const token = localStorage.getItem("token");
    const token = sessionStorage.getItem("token");
    if (!token) return;

    axios
      .get("http://localhost:3000/auth/me-request", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setUser(null);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, success }}> {children} </AuthContext.Provider>
  );
};