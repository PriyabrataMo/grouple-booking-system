import { createContext } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: () => void; // Just updates the context state based on auth utils
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Export the User interface so it can be used elsewhere
export type { User };
