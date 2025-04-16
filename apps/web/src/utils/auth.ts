import api from "./api";
import Cookies from "js-cookie";

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";

// Register a new user
export const signup = async (
  username: string,
  email: string,
  password: string,
  fullName?: string
): Promise<User> => {
  try {
    const response = await api.post<AuthResponse>("/auth/signup", {
      username,
      email,
      password,
      fullName,
    });

    // Store token in cookies and localStorage
    Cookies.set(TOKEN_KEY, response.data.token);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

    // Return user data
    return response.data.user;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

// Login user
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const response = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    // Store token in cookies and localStorage
    Cookies.set(TOKEN_KEY, response.data.token);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

    // Return user data
    return response.data.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    // Call server to invalidate the token
    await api.post("/auth/logout");

    // Clear localStorage and cookies
    localStorage.removeItem("token");
    localStorage.removeItem(USER_KEY);
    Cookies.remove("token");
    Cookies.remove(TOKEN_KEY);

    // Redirect to login page after logout
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);

    // Even if server logout fails, clear client-side storage
    localStorage.removeItem("token");
    localStorage.removeItem(USER_KEY);
    Cookies.remove("token");
    Cookies.remove(TOKEN_KEY);

    throw error;
  }
};

// Get current user info
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get<{ user: User }>("/auth/me");
    return response.data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Get token from cookies
export const getToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY) || Cookies.get("token");
};

// Get user from localStorage
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Check if user is logged in
export const isAuthenticated = (): boolean => {
  // Check for token in cookies first (preferred method)
  const hasTokenCookie =
    Cookies.get("token") !== undefined || Cookies.get(TOKEN_KEY) !== undefined;

  // Fallback to localStorage
  const hasTokenLocalStorage = localStorage.getItem("token") !== null;

  return hasTokenCookie || hasTokenLocalStorage;
};
