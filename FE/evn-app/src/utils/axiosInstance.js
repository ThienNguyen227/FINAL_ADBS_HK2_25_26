import axios from "axios";
import { refreshTokenAPI } from "../services/authService";

const api = axios.create({
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const res = await refreshTokenAPI();

        sessionStorage.setItem(
          "token",
          res.data.accessToken
        );

        originalRequest.headers.Authorization =
          `Bearer ${res.data.accessToken}`;

        return api(originalRequest);

      } catch {
        sessionStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;