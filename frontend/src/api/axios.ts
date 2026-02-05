// Hospital_Management\frontend\src\api\axios.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import ToastService from "../utils/toastService";

const api = axios.create({
  baseURL: "http://localhost:8000/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest?.url || "";
    if (url.includes("/user/refresh/")) {
      return Promise.reject(error);
    }

    // If 401 -> try refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              (originalRequest.headers as any).Authorization =
                `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const rs = await api.post(
          "/user/refresh/",
          {},
          { withCredentials: true },
        );
        const newAccessToken = rs.data.access_token;
        const user = rs.data.user;
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        console.log("Removed Old and added new.");
        localStorage.setItem("access_token", newAccessToken);
        localStorage.setItem("user", JSON.stringify(user));

        if (!newAccessToken) throw new Error("refresh failed");

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        (originalRequest.headers as any).Authorization =
          `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;

        // Refresh failed: clear stored tokens and redirect to login
        try {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
        } catch (e) {
          // ignore
        }
        ToastService.error("Session expired. Please login again.");
        window.location.href = "/user/login";
        console.log("Not Reached");

        return Promise.reject(err);
      }
    }

    // For other errors surface human friendly message via toast
    if (error.response) {
      const message =
        (error.response.data as any)?.error ||
        (error.response.data as any)?.message ||
        error.message ||
        "An error occurred";
      // Do not show toast for validation inline (components might handle) - still show for network/server errors
      if (
        error.response.status >= 500 ||
        error.response.status === 400 ||
        error.response.status === 403
      ) {
        // ToastService.error(message.toString());
      }
    } else {
      // Network / CORS / timeout
      ToastService.error("Network error. Check your connection.");
    }

    return Promise.reject(error);
  },
);

export default api;
