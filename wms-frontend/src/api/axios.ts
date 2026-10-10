import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const publicRegistrationRequest =
    config.url === "/register" ||
    config.url === "/register/request-otp" ||
    config.url === "/register/verify-otp";

  if (publicRegistrationRequest) {
    return config;
  }

  const token = 
    localStorage.getItem("auth_token") ??
    sessionStorage.getItem("auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;