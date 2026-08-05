import axios from "axios";
import { getApiUrl } from "./utils";

// Ensure all axios requests (both default axios and custom api instance) send cookies
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

const responseInterceptor = async (error: any) => {
  const originalRequest = error?.config;

  // Intercept 403 EMAIL_NOT_VERIFIED and redirect to /verify-pending
  if (
    error.response?.status === 403 &&
    error.response?.data?.code === "EMAIL_NOT_VERIFIED"
  ) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/verify-pending")) {
      window.location.href = "/verify-pending";
      // Return a pending promise so Next.js dev overlay doesn't throw an unhandled promise rejection while navigating
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }

  if (!originalRequest) {
    return Promise.reject(error);
  }

  // Do not attempt refresh on auth endpoints (login, register, refresh)
  const isAuthEndpoint =
    originalRequest.url?.includes("/auth/login") ||
    originalRequest.url?.includes("/auth/register") ||
    originalRequest.url?.includes("/auth/refresh");

  if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/refresh");
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("armbiz_auth_unauthorized"));
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, responseInterceptor);
axios.interceptors.response.use((response) => response, responseInterceptor);

export default api;

