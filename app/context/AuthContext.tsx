import { useUser } from "@/hooks/useUser";
import React, { createContext, ReactNode, useContext } from "react";

interface AuthContextType {
  user: any;
  inventory: any;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => Promise<any>;
  refetchInventory: () => Promise<any>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user } = useUser();

  const isAuthenticated = !!user;

  // // Context value
  const value = {
    user,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
