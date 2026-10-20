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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? "";
    const isLoginRequest = requestUrl === "/login";
    const hasStoredToken = Boolean(
      localStorage.getItem("auth_token") ??
      sessionStorage.getItem("auth_token"),
    );

    if (error.response?.status === 401 && hasStoredToken && !isLoginRequest) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default api;
