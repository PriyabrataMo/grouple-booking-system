import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { isAuthenticated, getUser, logout } from "../utils/auth";

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: () => void; // Just updates the context state based on auth utils
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
