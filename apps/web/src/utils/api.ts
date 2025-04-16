import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";

// Create an Axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for sending/receiving cookies
});

// Add request interceptor for adding auth token from localStorage or cookies if needed
api.interceptors.request.use(
  (config) => {
    // Try to get the token from cookies first (more secure)
    let token = Cookies.get(TOKEN_KEY) || Cookies.get("token");

    // Fallback to localStorage if not in cookies
    if (!token) {
      token = localStorage.getItem("token") as string;
    }

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling
    const errorResponse = {
      message: "An unexpected error occurred",
      status: error.response?.status,
      errors: error.response?.data?.errors,
      details: error.response?.data?.details,
    };

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      errorResponse.message =
        error.response?.data?.message ||
        "Authentication required - please log in";

      // Clear any stored tokens from both cookies and localStorage
      Cookies.remove(TOKEN_KEY);
      Cookies.remove("token");
      localStorage.removeItem("token");
      localStorage.removeItem("user_data");

      // Redirect to login if not already there
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/signup") {
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden errors
    else if (error.response && error.response.status === 403) {
      errorResponse.message =
        error.response?.data?.message ||
        "You don't have permission to perform this action";
      console.error("Permission denied:", errorResponse.message);
    }

    // Handle 404 Not Found errors
    else if (error.response && error.response.status === 404) {
      errorResponse.message =
        error.response?.data?.message || "The requested resource was not found";
    }

    // Handle 400 Bad Request errors
    else if (error.response && error.response.status === 400) {
      errorResponse.message =
        error.response?.data?.message ||
        "Bad request - please check your input";
    }

    // Handle 500 Server errors
    else if (error.response && error.response.status >= 500) {
      errorResponse.message = "Server error - please try again later";
    }

    // Add the error details to the error object
    error.errorDetails = errorResponse;

    return Promise.reject(error);
  }
);

export default api;
