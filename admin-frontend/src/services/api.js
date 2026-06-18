import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor – attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Login ke baad set hona chahiye
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor – handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        type: "network",
        message: "Network error. Please check your connection.",
      });
    }

    const { status, data } = error.response;

    if (status === 401) {
      return Promise.reject({
        type: "auth",
        status: 401,
        message: data?.message || "Unauthorized",
      });
    }

    if (status === 403) {
      return Promise.reject({
        type: "permission",
        status: 403,
        message: data?.message || "Forbidden",
      });
    }

    if (status === 404) {
      return Promise.reject({
        type: "notFound",
        status: 404,
        message: data?.message || "Not found",
      });
    }

    if (status === 400) {
      return Promise.reject({
        type: "validation",
        status: 400,
        message: data?.message || "Bad request",
      });
    }

    if (status >= 500) {
      return Promise.reject({
        type: "server",
        status,
        message: "Server error. Try again later.",
      });
    }

    return Promise.reject({
      type: "unknown",
      status,
      message: data?.message || "Something went wrong",
    });
  }
);

export default api;
