import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("dms_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
