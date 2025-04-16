import React, { useState, useEffect, ReactNode } from "react";
import { isAuthenticated, getUser, logout } from "../utils/auth";
import { AuthContext } from "./AuthContext";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [user, setUser] = useState(getUser());

  // Update auth state function
  const updateAuthState = () => {
    setIsLoggedIn(isAuthenticated());
    setUser(getUser());
  };

  // Handle login (just updates the state)
  const handleLogin = () => {
    updateAuthState();
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    updateAuthState();
  };

  // Check auth state on mount
  useEffect(() => {
    updateAuthState();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
