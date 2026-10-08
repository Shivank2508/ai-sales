import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Global response interceptor for logging & normalized errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Standard error formatting
    let message = "An unexpected error occurred.";
    if (error.response?.data) {
      const data: any = error.response.data;
      message = data.message || data.error || message;
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);
