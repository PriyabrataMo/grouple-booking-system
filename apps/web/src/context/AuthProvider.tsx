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

  // Check auth state on mount and add storage event listener
  useEffect(() => {
    updateAuthState();
    
    // Listen for storage events (when localStorage is changed in another tab or manually)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "token" || event.key === "user_data" || event.key === null) {
        updateAuthState();
      }
    };

    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Setup an interval to periodically check auth state (for same-tab manual deletion)
    const checkAuthInterval = setInterval(() => {
      const currentAuthState = isAuthenticated();
      if (currentAuthState !== isLoggedIn) {
        updateAuthState();
      }
    }, 3000); // Check every 3 seconds

    // Clean up function
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkAuthInterval);
    };
  }, [isLoggedIn]);

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
